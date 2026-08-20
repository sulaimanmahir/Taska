<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\WholesalePriceTier;
use App\Models\WholesaleRouteRun;
use App\Models\WholesaleRouteStop;
use App\Models\WholesaleSalesRep;
use App\Models\WholesaleStockTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WholesaleService
{
    public function __construct(
        private OrderService $orderService,
    ) {
    }

    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        return [
            'summary' => [
                'route_runs_today' => WholesaleRouteRun::where('business_id', $businessId)->whereDate('route_date', $today)->count(),
                'active_reps' => WholesaleSalesRep::where('business_id', $businessId)->where('status', 'active')->count(),
                'bulk_orders_today' => Order::where('business_id', $businessId)->whereDate('created_at', $today)->where('notes', 'like', '%wholesale%')->count(),
                'route_collections_today' => (float) WholesaleRouteStop::query()
                    ->join('wholesale_route_runs', 'wholesale_route_runs.id', '=', 'wholesale_route_stops.route_run_id')
                    ->where('wholesale_route_runs.business_id', $businessId)
                    ->whereDate('wholesale_route_runs.route_date', $today)
                    ->sum('wholesale_route_stops.collected_amount'),
                'customer_debt' => (float) Customer::where('business_id', $businessId)->sum('balance'),
                'stock_transfers_today' => WholesaleStockTransfer::where('business_id', $businessId)->whereDate('created_at', $today)->count(),
            ],
            'sales_reps' => WholesaleSalesRep::where('business_id', $businessId)->latest()->get(),
            'price_tiers' => WholesalePriceTier::with(['customer', 'product'])->where('business_id', $businessId)->latest()->get(),
            'route_runs' => WholesaleRouteRun::with(['salesRep', 'stops.customer'])->where('business_id', $businessId)->latest('route_date')->get(),
            'stock_transfers' => WholesaleStockTransfer::with(['fromWarehouse', 'toWarehouse', 'product'])->where('business_id', $businessId)->latest()->get(),
            'recent_orders' => Order::with(['customer', 'items.product'])->where('business_id', $businessId)->latest()->limit(10)->get(),
        ];
    }

    public function createSalesRep(array $payload, int $businessId, ?int $branchId): WholesaleSalesRep
    {
        return WholesaleSalesRep::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => $payload['name'],
            'phone' => $payload['phone'] ?? null,
            'territory' => $payload['territory'] ?? null,
            'target_amount' => $payload['target_amount'] ?? 0,
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function createPriceTier(array $payload, int $businessId): WholesalePriceTier
    {
        return WholesalePriceTier::create([
            'business_id' => $businessId,
            'customer_id' => $payload['customer_id'] ?? null,
            'product_id' => $payload['product_id'],
            'tier_name' => $payload['tier_name'],
            'minimum_quantity' => $payload['minimum_quantity'],
            'unit_price' => $payload['unit_price'],
            'discount_percent' => $payload['discount_percent'] ?? 0,
        ]);
    }

    public function createRouteRun(array $payload, int $businessId, ?int $branchId): WholesaleRouteRun
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId) {
            $routeRun = WholesaleRouteRun::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'sales_rep_id' => $payload['sales_rep_id'] ?? null,
                'route_name' => $payload['route_name'],
                'status' => $payload['status'] ?? 'planned',
                'route_date' => $payload['route_date'],
                'vehicle_reference' => $payload['vehicle_reference'] ?? null,
                'target_amount' => $payload['target_amount'] ?? 0,
                'notes' => $payload['notes'] ?? null,
            ]);

            foreach ($payload['stops'] ?? [] as $stop) {
                WholesaleRouteStop::create([
                    'route_run_id' => $routeRun->id,
                    'customer_id' => $stop['customer_id'] ?? null,
                    'stop_name' => $stop['stop_name'],
                    'status' => $stop['status'] ?? 'planned',
                    'expected_amount' => $stop['expected_amount'] ?? 0,
                    'notes' => $stop['notes'] ?? null,
                ]);
            }

            return $routeRun->load(['salesRep', 'stops.customer']);
        });
    }

    public function updateRouteRun(WholesaleRouteRun $routeRun, array $payload): WholesaleRouteRun
    {
        $routeRun->update([
            'status' => $payload['status'] ?? $routeRun->status,
            'actual_amount' => $payload['actual_amount'] ?? $routeRun->actual_amount,
            'notes' => $payload['notes'] ?? $routeRun->notes,
        ]);

        return $routeRun->fresh(['salesRep', 'stops.customer']);
    }

    public function createWholesaleOrder(array $payload, int $businessId, ?int $branchId, int $userId): Order
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId, $userId) {
            $items = collect($payload['items'])->map(function (array $item) use ($businessId, $payload) {
                $priceTier = WholesalePriceTier::query()
                    ->where('business_id', $businessId)
                    ->where('product_id', $item['product_id'])
                    ->when($payload['customer_id'] ?? null, fn ($query, $customerId) => $query->where(function ($inner) use ($customerId) {
                        $inner->whereNull('customer_id')->orWhere('customer_id', $customerId);
                    }))
                    ->where('minimum_quantity', '<=', $item['quantity'])
                    ->orderByDesc('minimum_quantity')
                    ->first();

                $product = $this->resolveProduct($businessId, $item['product_id']);
                $unitPrice = $priceTier?->unit_price ? (float) $priceTier->unit_price : (float) ($item['unit_price'] ?? $product->selling_price);
                $total = round($unitPrice * (float) $item['quantity'], 2);

                return [
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total' => $total,
                ];
            })->all();

            $subtotal = collect($items)->sum('total');

            $order = $this->orderService->createOrder([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'customer_id' => $payload['customer_id'] ?? null,
                'items' => $items,
                'subtotal' => $subtotal,
                'discount' => $payload['discount'] ?? 0,
                'tax' => 0,
                'total' => $subtotal - (float) ($payload['discount'] ?? 0),
                'paid' => $payload['paid'] ?? 0,
                'change' => 0,
                'payment_method' => $payload['payment_method'] ?? 'transfer',
                'notes' => trim(($payload['notes'] ?? '') . ' wholesale'),
                'warehouse_id' => $payload['warehouse_id'] ?? null,
            ], $userId);

            if (!empty($payload['route_run_id']) && !empty($payload['stop_name'])) {
                WholesaleRouteStop::create([
                    'route_run_id' => $payload['route_run_id'],
                    'customer_id' => $payload['customer_id'] ?? null,
                    'order_id' => $order->id,
                    'stop_name' => $payload['stop_name'],
                    'status' => 'completed',
                    'expected_amount' => $order->total,
                    'collected_amount' => $order->paid,
                    'notes' => 'Auto-recorded from wholesale order',
                ]);
            }

            return $order->load(['customer', 'items.product']);
        });
    }

    public function createStockTransfer(array $payload, int $businessId, int $userId): WholesaleStockTransfer
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $quantity = (float) $payload['quantity'];

            $fromInventory = InventoryItem::firstOrNew([
                'business_id' => $businessId,
                'warehouse_id' => $payload['from_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => $payload['variant_id'] ?? null,
            ]);

            $toInventory = InventoryItem::firstOrNew([
                'business_id' => $businessId,
                'warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => $payload['variant_id'] ?? null,
            ]);

            $fromPrevious = (float) ($fromInventory->quantity ?? 0);
            $toPrevious = (float) ($toInventory->quantity ?? 0);

            if ($fromPrevious < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['The source warehouse does not have enough stock for this transfer.'],
                ]);
            }

            $fromInventory->quantity = $fromPrevious - $quantity;
            $toInventory->quantity = $toPrevious + $quantity;
            $fromInventory->save();
            $toInventory->save();

            $transfer = WholesaleStockTransfer::create([
                'business_id' => $businessId,
                'from_warehouse_id' => $payload['from_warehouse_id'],
                'to_warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => $payload['variant_id'] ?? null,
                'quantity' => $quantity,
                'status' => 'completed',
                'notes' => $payload['notes'] ?? null,
                'created_by' => $userId,
            ]);

            InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['from_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => $payload['variant_id'] ?? null,
                'movement_type' => 'transfer_out',
                'quantity' => -$quantity,
                'previous_quantity' => $fromPrevious,
                'new_quantity' => $fromInventory->quantity,
                'reference_type' => 'wholesale_transfer',
                'reference_id' => $transfer->id,
                'created_by' => $userId,
            ]);

            InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => $payload['variant_id'] ?? null,
                'movement_type' => 'transfer_in',
                'quantity' => $quantity,
                'previous_quantity' => $toPrevious,
                'new_quantity' => $toInventory->quantity,
                'reference_type' => 'wholesale_transfer',
                'reference_id' => $transfer->id,
                'created_by' => $userId,
            ]);

            return $transfer->load(['fromWarehouse', 'toWarehouse', 'product']);
        });
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }
}
