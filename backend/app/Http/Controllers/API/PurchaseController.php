<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchases\ReceivePurchaseRequest;
use App\Http\Requests\Purchases\RecordPurchasePaymentRequest;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Resources\PurchasePaymentResource;
use App\Http\Resources\PurchaseResource;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $purchases = Purchase::query()
            ->where('business_id', $businessId)
            ->with([
                'supplier',
                'warehouse',
                'items.product',
                'items.variant',
                'payments' => fn ($query) => $query->latest('paid_at'),
            ])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->status))
            ->latest()
            ->paginate(20);

        $summary = Purchase::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COUNT(*) as total_purchases,
                COALESCE(SUM(total), 0) as total_value,
                COALESCE(SUM(total - paid), 0) as outstanding_balance,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
                COALESCE(SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END), 0) as partial_count,
                COALESCE(SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END), 0) as received_count
            ")
            ->first();

        return response()->json([
            'data' => PurchaseResource::collection($purchases->items())->resolve(),
            'links' => [
                'next' => $purchases->nextPageUrl(),
                'prev' => $purchases->previousPageUrl(),
            ],
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
            'summary' => [
                'total_purchases' => (int) ($summary?->total_purchases ?? 0),
                'total_value' => (float) ($summary?->total_value ?? 0),
                'outstanding_balance' => (float) ($summary?->outstanding_balance ?? 0),
                'pending_count' => (int) ($summary?->pending_count ?? 0),
                'partial_count' => (int) ($summary?->partial_count ?? 0),
                'received_count' => (int) ($summary?->received_count ?? 0),
            ],
        ]);
    }

    public function store(StorePurchaseRequest $request)
    {
        $this->authorize('create', Purchase::class);

        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $purchase = DB::transaction(function () use ($validated, $request, $businessId) {
            $subtotal = collect($validated['items'])->sum(
                fn (array $item) => (float) $item['quantity_ordered'] * (float) $item['unit_cost']
            );
            $discount = (float) ($validated['discount'] ?? 0);
            $total = max($subtotal - $discount, 0);

            $purchase = Purchase::create([
                'business_id' => $businessId,
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'created_by' => $request->user()->id,
                'purchase_number' => Purchase::generatePurchaseNumber($businessId),
                'status' => 'pending',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'paid' => 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'total' => (float) $item['quantity_ordered'] * (float) $item['unit_cost'],
                ]);
            }

            $this->refreshSupplierBalance($validated['supplier_id']);

            return $purchase;
        });

        return response()->json(
            (new PurchaseResource($this->loadPurchase($purchase->id)))->resolve(),
            201
        );
    }

    public function show(Request $request, Purchase $purchase)
    {
        $this->authorize('view', $purchase);

        return response()->json((new PurchaseResource($this->loadPurchase($purchase->id)))->resolve());
    }

    public function receive(ReceivePurchaseRequest $request, Purchase $purchase)
    {
        $this->authorize('update', $purchase);
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $purchase, $request, $businessId) {
            foreach ($validated['items'] as $receiptLine) {
                /** @var PurchaseItem $item */
                $item = $purchase->items()->with('product')->findOrFail($receiptLine['purchase_item_id']);
                $quantityReceived = (float) $receiptLine['quantity_received'];
                $remainingQuantity = max((float) $item->quantity_ordered - (float) $item->quantity_received, 0);

                if ($quantityReceived > $remainingQuantity) {
                    throw ValidationException::withMessages([
                        'items' => ['Receive quantity cannot exceed the remaining ordered quantity.'],
                    ]);
                }

                $item->quantity_received = (float) $item->quantity_received + $quantityReceived;
                $item->save();

                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'business_id' => $businessId,
                        'warehouse_id' => $purchase->warehouse_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'reorder_point' => (float) ($item->product?->low_stock_alert ?? 10),
                        'reorder_quantity' => (float) ($item->product?->low_stock_alert ?? 10),
                    ]
                );

                $previousQuantity = (float) $inventoryItem->quantity;
                $inventoryItem->quantity = $previousQuantity + $quantityReceived;
                $inventoryItem->save();

                Product::whereKey($item->product_id)->update([
                    'cost_price' => $item->unit_cost,
                ]);

                InventoryMovement::create([
                    'business_id' => $businessId,
                    'warehouse_id' => $purchase->warehouse_id,
                    'branch_id' => $request->user()->current_branch_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'movement_type' => 'purchase_receive',
                    'quantity' => $quantityReceived,
                    'previous_quantity' => $previousQuantity,
                    'new_quantity' => (float) $inventoryItem->quantity,
                    'unit_cost' => $item->unit_cost,
                    'total_cost' => $quantityReceived * (float) $item->unit_cost,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'notes' => $validated['notes'] ?? $purchase->notes,
                    'created_by' => $request->user()->id,
                ]);
            }

            $purchase->refresh();
            $totalOrdered = (float) $purchase->items()->sum('quantity_ordered');
            $totalReceived = (float) $purchase->items()->sum('quantity_received');

            $purchase->status = $totalReceived <= 0
                ? 'pending'
                : ($totalReceived >= $totalOrdered ? 'received' : 'partial');
            $purchase->save();
        });

        return response()->json((new PurchaseResource($this->loadPurchase($purchase->id)))->resolve());
    }

    public function recordPayment(RecordPurchasePaymentRequest $request, Purchase $purchase)
    {
        $this->authorize('update', $purchase);
        $validated = $request->validated();

        $payment = DB::transaction(function () use ($validated, $purchase, $request) {
            $purchase->refresh();
            $outstandingBalance = $purchase->outstandingBalance();
            $amount = (float) $validated['amount'];

            if ($amount > $outstandingBalance) {
                throw ValidationException::withMessages([
                    'amount' => ['Payment amount cannot exceed the outstanding purchase balance.'],
                ]);
            }

            $payment = PurchasePayment::create([
                'business_id' => $purchase->business_id,
                'purchase_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id,
                'created_by' => $request->user()->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'] ?? 'transfer',
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'paid_at' => $validated['paid_at'] ?? now(),
            ]);

            $purchase->paid = (float) $purchase->paid + $amount;
            $purchase->save();

            $this->refreshSupplierBalance($purchase->supplier_id);

            return $payment;
        });

        return response()->json([
            'payment' => (new PurchasePaymentResource($payment))->resolve(),
            'purchase' => (new PurchaseResource($this->loadPurchase($purchase->id)))->resolve(),
        ], 201);
    }

    private function loadPurchase(int $purchaseId): Purchase
    {
        return Purchase::query()
            ->with([
                'supplier',
                'warehouse',
                'items.product',
                'items.variant',
                'payments' => fn ($query) => $query->latest('paid_at'),
            ])
            ->findOrFail($purchaseId);
    }

    private function refreshSupplierBalance(int $supplierId): void
    {
        $balance = Purchase::query()
            ->where('supplier_id', $supplierId)
            ->sum(DB::raw('total - paid'));

        Supplier::whereKey($supplierId)->update([
            'balance' => max((float) $balance, 0),
        ]);
    }
}
