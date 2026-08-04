<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createOrder(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $warehouseId = $data['warehouse_id'] ?? $this->getDefaultWarehouse($data['business_id']);

            foreach ($data['items'] as $item) {
                $this->ensureInventoryAvailable(
                    $data['business_id'],
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

                $this->deductInventory(
                    $data['business_id'],
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
            if ($data['customer_id'] && ($data['total'] - $data['paid']) > 0) {
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

            $warehouseId = $this->getDefaultWarehouse($original->business_id);

            foreach ($original->items as $item) {
                OrderItem::create([
                    'order_id' => $return->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                ]);

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

            $warehouseId = $this->getDefaultWarehouse($original->business_id);
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
