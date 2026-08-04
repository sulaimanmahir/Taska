<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\PureWaterRetailCrateLedger;
use App\Models\PureWaterRetailPackageMovement;
use App\Models\PureWaterRetailPriceTier;
use Illuminate\Support\Facades\DB;

class PureWaterRetailService
{
    public function __construct(
        private OrderService $orderService,
    ) {
    }

    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $salesSummary = Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->where('notes', 'like', '%pure_water_retail:%')
            ->selectRaw("
                COALESCE(SUM(total), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN notes like '%:wholesale:%' THEN total ELSE 0 END), 0) as wholesale_revenue_today,
                COALESCE(SUM(CASE WHEN notes like '%:retail:%' THEN total ELSE 0 END), 0) as retail_revenue_today
            ")
            ->first();

        $packageSummary = PureWaterRetailPackageMovement::where('business_id', $businessId)
            ->whereDate('recorded_at', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN movement_type = 'sale' THEN quantity ELSE 0 END), 0) as packages_sold_today,
                COALESCE(SUM(CASE WHEN movement_type = 'transfer_out' THEN quantity ELSE 0 END), 0) as transfers_out_today,
                COALESCE(SUM(CASE WHEN movement_type = 'wastage' THEN quantity ELSE 0 END), 0) as wastage_today
            ")
            ->first();

        $crateSummary = PureWaterRetailCrateLedger::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN movement_type = 'issue' THEN crate_count ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN movement_type = 'return' THEN crate_count ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN movement_type = 'adjustment_out' THEN crate_count ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN movement_type = 'adjustment_in' THEN crate_count ELSE 0 END), 0) as crates_outstanding
            ")
            ->first();

        $lowStockProducts = InventoryItem::query()
            ->join('products', 'products.id', '=', 'inventory_items.product_id')
            ->where('inventory_items.business_id', $businessId)
            ->whereColumn('inventory_items.quantity', '<=', 'products.low_stock_alert')
            ->count();

        return [
            'summary' => [
                'revenue_today' => (float) ($salesSummary?->revenue_today ?? 0),
                'wholesale_revenue_today' => (float) ($salesSummary?->wholesale_revenue_today ?? 0),
                'retail_revenue_today' => (float) ($salesSummary?->retail_revenue_today ?? 0),
                'packages_sold_today' => (float) ($packageSummary?->packages_sold_today ?? 0),
                'transfers_out_today' => (float) ($packageSummary?->transfers_out_today ?? 0),
                'wastage_today' => (float) ($packageSummary?->wastage_today ?? 0),
                'crates_outstanding' => (float) ($crateSummary?->crates_outstanding ?? 0),
                'customer_debt' => (float) Customer::where('business_id', $businessId)->sum('balance'),
                'low_stock_products' => $lowStockProducts,
            ],
            'price_tiers' => PureWaterRetailPriceTier::with(['customer', 'product'])
                ->where('business_id', $businessId)
                ->latest()
                ->get(),
            'package_movements' => PureWaterRetailPackageMovement::with(['product', 'customer', 'warehouse'])
                ->where('business_id', $businessId)
                ->latest('recorded_at')
                ->limit(12)
                ->get(),
            'crate_ledgers' => PureWaterRetailCrateLedger::with(['customer', 'product'])
                ->where('business_id', $businessId)
                ->latest('recorded_at')
                ->limit(12)
                ->get(),
            'recent_orders' => Order::with(['customer', 'items.product'])
                ->where('business_id', $businessId)
                ->where('notes', 'like', '%pure_water_retail:%')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    public function createPriceTier(array $payload, int $businessId): PureWaterRetailPriceTier
    {
        return PureWaterRetailPriceTier::create([
            'business_id' => $businessId,
            'customer_id' => $payload['customer_id'] ?? null,
            'product_id' => $payload['product_id'],
            'pricing_scope' => $payload['pricing_scope'] ?? 'retail',
            'package_type' => $payload['package_type'] ?? 'bag',
            'minimum_quantity' => $payload['minimum_quantity'],
            'unit_price' => $payload['unit_price'],
            'crate_deposit' => $payload['crate_deposit'] ?? 0,
            'notes' => $payload['notes'] ?? null,
        ])->fresh(['customer', 'product']);
    }

    public function createSale(array $payload, int $businessId, ?int $branchId, int $userId): Order
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId, $userId) {
            $channel = $payload['sales_channel'] ?? 'retail';

            $items = collect($payload['items'])->map(function (array $item) use ($businessId, $payload, $channel) {
                $product = $this->resolveProduct($businessId, $item['product_id']);
                $quantity = (float) $item['quantity'];
                $packageType = $item['package_type'] ?? 'bag';
                $unitPrice = $this->resolveUnitPrice(
                    $businessId,
                    $product->id,
                    $payload['customer_id'] ?? null,
                    $channel,
                    $packageType,
                    $quantity,
                    (float) ($item['unit_price'] ?? $product->selling_price)
                );

                return [
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total' => round($unitPrice * $quantity, 2),
                    'package_type' => $packageType,
                    'units_per_package' => (float) ($item['units_per_package'] ?? 1),
                ];
            })->all();

            $subtotal = collect($items)->sum('total');
            $discount = (float) ($payload['discount'] ?? 0);
            $total = $subtotal - $discount;

            $order = $this->orderService->createOrder([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'customer_id' => $payload['customer_id'] ?? null,
                'items' => collect($items)->map(fn (array $item) => [
                    'product_id' => $item['product_id'],
                    'variant_id' => null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['total'],
                ])->all(),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => 0,
                'total' => $total,
                'paid' => $payload['paid'] ?? 0,
                'change' => max((float) ($payload['paid'] ?? 0) - $total, 0),
                'payment_method' => $payload['payment_method'] ?? 'cash',
                'notes' => "pure_water_retail:{$channel}:" . ($payload['delivery_mode'] ?? 'counter'),
                'warehouse_id' => $payload['warehouse_id'] ?? null,
            ], $userId);

            foreach ($items as $item) {
                $this->recordPackageMovement([
                    'warehouse_id' => $payload['warehouse_id'] ?? null,
                    'product_id' => $item['product_id'],
                    'customer_id' => $payload['customer_id'] ?? null,
                    'movement_type' => 'sale',
                    'package_type' => $item['package_type'],
                    'quantity' => $item['quantity'],
                    'units_per_package' => $item['units_per_package'],
                    'sales_channel' => $channel,
                    'reference_order_id' => $order->id,
                    'notes' => $payload['notes'] ?? null,
                    'recorded_at' => now(),
                ], $businessId, $branchId, $userId);
            }

            return $order->load(['customer', 'items.product']);
        });
    }

    public function recordPackageMovement(array $payload, int $businessId, ?int $branchId, int $userId): PureWaterRetailPackageMovement
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId, $userId) {
            $quantity = (float) $payload['quantity'];
            $unitsPerPackage = max((float) ($payload['units_per_package'] ?? 1), 1);
            $unitEquivalent = $quantity * $unitsPerPackage;
            $warehouseId = $payload['warehouse_id'] ?? $this->getDefaultWarehouse($businessId);
            $inventory = InventoryItem::firstOrNew([
                'business_id' => $businessId,
                'warehouse_id' => $warehouseId,
                'product_id' => $payload['product_id'],
                'variant_id' => null,
            ]);

            $previous = (float) ($inventory->quantity ?? 0);
            $delta = in_array($payload['movement_type'], ['restock', 'transfer_in', 'adjustment_in'], true)
                ? $quantity
                : -$quantity;

            $inventory->quantity = $previous + $delta;
            $inventory->save();

            $movement = PureWaterRetailPackageMovement::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'product_id' => $payload['product_id'],
                'customer_id' => $payload['customer_id'] ?? null,
                'movement_type' => $payload['movement_type'],
                'package_type' => $payload['package_type'] ?? 'bag',
                'quantity' => $quantity,
                'units_per_package' => $unitsPerPackage,
                'unit_equivalent_quantity' => $unitEquivalent,
                'sales_channel' => $payload['sales_channel'] ?? null,
                'reference_order_id' => $payload['reference_order_id'] ?? null,
                'recorded_by' => $userId,
                'notes' => $payload['notes'] ?? null,
                'recorded_at' => $payload['recorded_at'] ?? now(),
            ]);

            InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $warehouseId,
                'product_id' => $payload['product_id'],
                'variant_id' => null,
                'movement_type' => $payload['movement_type'],
                'quantity' => $delta,
                'previous_quantity' => $previous,
                'new_quantity' => $inventory->quantity,
                'reference_type' => 'pure_water_retail',
                'reference_id' => $movement->id,
                'created_by' => $userId,
            ]);

            return $movement->fresh(['product', 'customer', 'warehouse']);
        });
    }

    public function recordCrateMovement(array $payload, int $businessId, ?int $branchId, int $userId): PureWaterRetailCrateLedger
    {
        $currentBalance = (float) PureWaterRetailCrateLedger::where('business_id', $businessId)
            ->when($payload['customer_id'] ?? null, fn ($query, $customerId) => $query->where('customer_id', $customerId))
            ->sum(DB::raw("
                CASE
                    WHEN movement_type = 'issue' THEN crate_count
                    WHEN movement_type = 'return' THEN -crate_count
                    WHEN movement_type = 'adjustment_in' THEN crate_count
                    ELSE -crate_count
                END
            "));

        $crateCount = (float) $payload['crate_count'];
        $delta = in_array($payload['movement_type'], ['issue', 'adjustment_in'], true) ? $crateCount : -$crateCount;

        return PureWaterRetailCrateLedger::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'customer_id' => $payload['customer_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'movement_type' => $payload['movement_type'],
            'crate_count' => $crateCount,
            'deposit_amount' => $payload['deposit_amount'] ?? 0,
            'balance_after' => $currentBalance + $delta,
            'recorded_by' => $userId,
            'notes' => $payload['notes'] ?? null,
            'recorded_at' => $payload['recorded_at'] ?? now(),
        ])->fresh(['customer', 'product']);
    }

    public function transferStock(array $payload, int $businessId, int $userId): array
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $quantity = (float) $payload['quantity'];
            $fromWarehouse = InventoryItem::firstOrNew([
                'business_id' => $businessId,
                'warehouse_id' => $payload['from_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => null,
            ]);
            $toWarehouse = InventoryItem::firstOrNew([
                'business_id' => $businessId,
                'warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => null,
            ]);

            $fromPrevious = (float) ($fromWarehouse->quantity ?? 0);
            $toPrevious = (float) ($toWarehouse->quantity ?? 0);
            $fromWarehouse->quantity = $fromPrevious - $quantity;
            $toWarehouse->quantity = $toPrevious + $quantity;
            $fromWarehouse->save();
            $toWarehouse->save();

            $out = PureWaterRetailPackageMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['from_warehouse_id'],
                'product_id' => $payload['product_id'],
                'movement_type' => 'transfer_out',
                'package_type' => $payload['package_type'] ?? 'bag',
                'quantity' => $quantity,
                'units_per_package' => $payload['units_per_package'] ?? 1,
                'unit_equivalent_quantity' => $quantity * (float) ($payload['units_per_package'] ?? 1),
                'recorded_by' => $userId,
                'notes' => $payload['notes'] ?? null,
                'recorded_at' => now(),
            ]);

            $in = PureWaterRetailPackageMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'movement_type' => 'transfer_in',
                'package_type' => $payload['package_type'] ?? 'bag',
                'quantity' => $quantity,
                'units_per_package' => $payload['units_per_package'] ?? 1,
                'unit_equivalent_quantity' => $quantity * (float) ($payload['units_per_package'] ?? 1),
                'recorded_by' => $userId,
                'notes' => $payload['notes'] ?? null,
                'recorded_at' => now(),
            ]);

            InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['from_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => null,
                'movement_type' => 'transfer_out',
                'quantity' => -$quantity,
                'previous_quantity' => $fromPrevious,
                'new_quantity' => $fromWarehouse->quantity,
                'reference_type' => 'pure_water_retail',
                'reference_id' => $out->id,
                'created_by' => $userId,
            ]);

            InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $payload['to_warehouse_id'],
                'product_id' => $payload['product_id'],
                'variant_id' => null,
                'movement_type' => 'transfer_in',
                'quantity' => $quantity,
                'previous_quantity' => $toPrevious,
                'new_quantity' => $toWarehouse->quantity,
                'reference_type' => 'pure_water_retail',
                'reference_id' => $in->id,
                'created_by' => $userId,
            ]);

            return [
                'out' => $out->fresh(['product', 'warehouse']),
                'in' => $in->fresh(['product', 'warehouse']),
            ];
        });
    }

    private function resolveUnitPrice(
        int $businessId,
        int $productId,
        ?int $customerId,
        string $channel,
        string $packageType,
        float $quantity,
        float $fallbackPrice,
    ): float {
        $tier = PureWaterRetailPriceTier::query()
            ->where('business_id', $businessId)
            ->where('product_id', $productId)
            ->where('package_type', $packageType)
            ->where('minimum_quantity', '<=', $quantity)
            ->whereIn('pricing_scope', [$channel, 'all'])
            ->when($customerId, function ($query, $customerId) {
                $query->where(function ($inner) use ($customerId) {
                    $inner->whereNull('customer_id')->orWhere('customer_id', $customerId);
                });
            }, fn ($query) => $query->whereNull('customer_id'))
            ->orderByRaw('CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('minimum_quantity')
            ->first();

        return (float) ($tier?->unit_price ?? $fallbackPrice);
    }

    private function getDefaultWarehouse(int $businessId): int
    {
        $warehouse = \App\Models\Warehouse::where('business_id', $businessId)
            ->where('is_default', true)
            ->first();

        if (!$warehouse) {
            $warehouse = \App\Models\Warehouse::where('business_id', $businessId)->first();
        }

        return $warehouse?->id ?? 1;
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }
}
