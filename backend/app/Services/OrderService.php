<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createOrder(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $businessId = $data['business_id'];
            $branchId = $data['branch_id'] ?? null;
            // An explicit warehouse_id (some verticals resolve their own,
            // e.g. ConstructionMaterialsService) always wins for the whole
            // order, preserving their existing behavior. Otherwise each
            // item routes through whichever warehouse is assigned to the
            // sale's branch - see resolveWarehouseForItem().
            $explicitWarehouseId = $data['warehouse_id'] ?? null;

            foreach ($data['items'] as $item) {
                if (!$this->isInventoryTracked($item['product_id'])) {
                    continue;
                }

                $warehouseId = $this->resolveWarehouseForItem($businessId, $branchId, $item['product_id'], $item['variant_id'] ?? null, $explicitWarehouseId);

                $this->ensureInventoryAvailable(
                    $businessId,
                    $warehouseId,
                    $item['product_id'],
                    $item['variant_id'] ?? null,
                    (float) $item['quantity']
                );
            }

            $order = Order::create([
                'business_id' => $data['business_id'],
                'branch_id' => $data['branch_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'created_by' => $userId,
                'order_number' => Order::generateOrderNumber($data['business_id']),
                'order_type' => $data['order_type'] ?? 'sale',
                'status' => 'completed',
                'subtotal' => $data['subtotal'],
                'discount' => $data['discount'] ?? 0,
                'tax' => $data['tax'] ?? 0,
                'total' => $data['total'],
                'paid' => $data['paid'],
                'change' => $data['change'] ?? 0,
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'] ?? 0,
                    'total' => $item['total'],
                ]);

                if (!$this->isInventoryTracked($item['product_id'])) {
                    continue;
                }

                $warehouseId = $this->resolveWarehouseForItem($businessId, $branchId, $item['product_id'], $item['variant_id'] ?? null, $explicitWarehouseId);

                $this->deductInventory(
                    $businessId,
                    $warehouseId,
                    $item['product_id'],
                    $item['variant_id'] ?? null,
                    (float) $item['quantity'],
                    $userId,
                    'sale',
                    'order',
                    $order->id
                );
            }

            // Update customer balance if credit sale
            if (($data['customer_id'] ?? null) && ($data['total'] - $data['paid']) > 0) {
                $customer = Customer::where('business_id', $data['business_id'])->findOrFail($data['customer_id']);
                $customer->balance += ($data['total'] - $data['paid']);
                $customer->save();
            }

            return $order;
        });
    }

    public function createReturn(int $orderId, int $businessId, int $userId): Order
    {
        return DB::transaction(function () use ($orderId, $businessId, $userId) {
            $original = $this->resolveOrder($orderId, $businessId);
            
            $return = Order::create([
                'business_id' => $original->business_id,
                'branch_id' => $original->branch_id,
                'customer_id' => $original->customer_id,
                'created_by' => $userId,
                'order_number' => Order::generateOrderNumber($original->business_id),
                'order_type' => 'return',
                'status' => 'completed',
                'subtotal' => -$original->subtotal,
                'total' => -$original->total,
                'paid' => -$original->total,
                'payment_method' => 'cash',
                'notes' => 'Return for order: ' . $original->order_number,
            ]);

            foreach ($original->items as $item) {
                OrderItem::create([
                    'order_id' => $return->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                ]);

                if (!$this->isInventoryTracked($item->product_id)) {
                    continue;
                }

                $warehouseId = $this->resolveOriginalSaleWarehouse($original->id, $item->product_id, $item->variant_id, $original->business_id);

                // Add back to inventory
                $this->addInventory(
                    $original->business_id,
                    $warehouseId,
                    $item->product_id,
                    $item->variant_id,
                    $item->quantity,
                    $userId,
                    'return',
                    'order',
                    $return->id
                );
            }

            return $return;
        });
    }

    public function createPartialReturn(int $orderId, int $businessId, array $lines, int $userId): Order
    {
        return DB::transaction(function () use ($orderId, $businessId, $lines, $userId) {
            $original = $this->resolveOrder($orderId, $businessId);

            $return = Order::create([
                'business_id' => $original->business_id,
                'branch_id' => $original->branch_id,
                'customer_id' => $original->customer_id,
                'created_by' => $userId,
                'order_number' => Order::generateOrderNumber($original->business_id),
                'order_type' => 'return',
                'status' => 'completed',
                'subtotal' => 0,
                'total' => 0,
                'paid' => 0,
                'payment_method' => 'cash',
                'notes' => 'Partial return for order: ' . $original->order_number,
            ]);

            $refundTotal = 0;

            foreach ($lines as $line) {
                $item = $original->items->firstWhere('product_id', $line['product_id']);

                if (!$item) {
                    continue;
                }

                $quantity = min((float) $line['quantity'], (float) $item->quantity);
                $lineTotal = round($quantity * (float) $item->unit_price, 2);
                $refundTotal += $lineTotal;

                OrderItem::create([
                    'order_id' => $return->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $lineTotal,
                ]);

                if (!$this->isInventoryTracked($item->product_id)) {
                    continue;
                }

                $warehouseId = $this->resolveOriginalSaleWarehouse($original->id, $item->product_id, $item->variant_id, $original->business_id);

                $this->addInventory(
                    $original->business_id,
                    $warehouseId,
                    $item->product_id,
                    $item->variant_id,
                    $quantity,
                    $userId,
                    'return',
                    'order',
                    $return->id
                );
            }

            $return->update([
                'subtotal' => -$refundTotal,
                'total' => -$refundTotal,
                'paid' => -$refundTotal,
            ]);

            return $return;
        });
    }

    /**
     * Products marked track_inventory = 'no' (services, fees, anything sold
     * without a stock count) never had an InventoryItem row, so the
     * unconditional stock check below used to fail every sale of one with
     * "Insufficient stock for this product." - this skips stock
     * checking/deduction/restocking for them entirely instead.
     */
    private function isInventoryTracked(int $productId): bool
    {
        return Product::where('id', $productId)->value('track_inventory') !== 'no';
    }

    private function ensureInventoryAvailable(int $businessId, int $warehouseId, int $productId, ?int $variantId, float $quantity): void
    {
        $inventory = InventoryItem::where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->first();

        $availableQty = (float) ($inventory?->quantity ?? 0);

        if ($availableQty < $quantity) {
            throw ValidationException::withMessages([
                'items' => ['Insufficient stock for this product.'],
            ]);
        }
    }

    private function deductInventory(int $businessId, int $warehouseId, int $productId, ?int $variantId, float $quantity, int $userId, string $refType, string $refTable, int $refId): void
    {
        $inventory = InventoryItem::firstOrNew([
            'business_id' => $businessId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId,
        ]);

        $prevQty = (float) ($inventory->quantity ?? 0);
        $inventory->quantity = $prevQty - $quantity;
        $inventory->save();

        InventoryMovement::create([
            'business_id' => $businessId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId,
            'movement_type' => 'sale',
            'quantity' => -$quantity,
            'previous_quantity' => $prevQty,
            'new_quantity' => $inventory->quantity,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'created_by' => $userId,
        ]);
    }

    private function addInventory(int $businessId, int $warehouseId, int $productId, ?int $variantId, float $quantity, int $userId, string $refType, string $refTable, int $refId): void
    {
        $inventory = InventoryItem::firstOrNew([
            'business_id' => $businessId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId,
        ]);

        $prevQty = $inventory->quantity ?? 0;
        $inventory->quantity = $prevQty + $quantity;
        $inventory->save();

        InventoryMovement::create([
            'business_id' => $businessId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId,
            'movement_type' => 'return',
            'quantity' => $quantity,
            'previous_quantity' => $prevQty,
            'new_quantity' => $inventory->quantity,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'created_by' => $userId,
        ]);
    }

    /**
     * A branch with one assigned warehouse (Settings > Warehouses) always
     * uses it. A branch with several picks whichever currently holds the
     * most stock of the specific product/variant being sold, so a sale
     * doesn't fail against an empty warehouse while a sibling warehouse on
     * the same branch has plenty. A branch with none assigned - or no
     * branch context at all - falls back to the single business-wide
     * default warehouse, exactly like before this routing existed.
     */
    private function resolveWarehouseForItem(int $businessId, ?int $branchId, int $productId, ?int $variantId, ?int $explicitWarehouseId): int
    {
        if ($explicitWarehouseId) {
            return $explicitWarehouseId;
        }

        if (!$branchId) {
            return $this->getDefaultWarehouse($businessId);
        }

        $branchWarehouseIds = Warehouse::where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->pluck('id');

        if ($branchWarehouseIds->isEmpty()) {
            return $this->getDefaultWarehouse($businessId);
        }

        if ($branchWarehouseIds->count() === 1) {
            return $branchWarehouseIds->first();
        }

        $bestWarehouseId = InventoryItem::where('business_id', $businessId)
            ->whereIn('warehouse_id', $branchWarehouseIds)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->orderByDesc('quantity')
            ->value('warehouse_id');

        return $bestWarehouseId ?? $branchWarehouseIds->first();
    }

    /**
     * A return restocks wherever the original sale actually drew from, not
     * a freshly re-resolved "most stock" warehouse - that would put items
     * back somewhere unrelated to where they left from.
     */
    private function resolveOriginalSaleWarehouse(int $orderId, int $productId, ?int $variantId, int $fallbackBusinessId): int
    {
        // deductInventory()'s reference_type is 'sale' (the label it was
        // called with), not the referenced table - reference_id is what
        // actually points at the order.
        $warehouseId = InventoryMovement::where('movement_type', 'sale')
            ->where('reference_id', $orderId)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->orderByDesc('id')
            ->value('warehouse_id');

        return $warehouseId ?? $this->getDefaultWarehouse($fallbackBusinessId);
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

    private function resolveOrder(int $orderId, int $businessId): Order
    {
        return Order::with('items')
            ->where('business_id', $businessId)
            ->findOrFail($orderId);
    }
}
