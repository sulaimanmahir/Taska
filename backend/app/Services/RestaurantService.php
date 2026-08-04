<?php

namespace App\Services;

use App\Models\FoodWasteLog;
use App\Models\KitchenTicket;
use App\Models\Product;
use App\Models\RecipeCard;
use App\Models\RecipeIngredient;
use App\Models\RestaurantTable;
use App\Models\RestaurantTicket;
use App\Models\RestaurantTicketItem;
use App\Models\RestaurantWaiterShift;
use App\Models\TableReservation;
use Illuminate\Support\Facades\DB;

class RestaurantService
{
    public function createTable(array $payload, int $businessId): RestaurantTable
    {
        return RestaurantTable::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createShift(array $payload, int $businessId): RestaurantWaiterShift
    {
        return RestaurantWaiterShift::create([
            ...$payload,
            'business_id' => $businessId,
            'shift_code' => $this->generateShiftCode($businessId),
            'status' => $payload['status'] ?? 'open',
        ]);
    }

    public function createRecipe(array $payload, int $businessId): RecipeCard
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $recipe = RecipeCard::create([
                'business_id' => $businessId,
                'product_id' => $payload['product_id'],
                'yield_quantity' => $payload['yield_quantity'] ?? 1,
                'prep_station' => $payload['prep_station'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'is_active' => $payload['is_active'] ?? true,
                'estimated_cost' => 0,
            ]);

            $estimatedCost = 0;

            foreach ($payload['ingredients'] ?? [] as $ingredient) {
                $lineCost = (float) ($ingredient['quantity'] ?? 0) * (float) ($ingredient['unit_cost'] ?? 0);
                $estimatedCost += $lineCost;

                RecipeIngredient::create([
                    'business_id' => $businessId,
                    'recipe_card_id' => $recipe->id,
                    'ingredient_product_id' => $ingredient['ingredient_product_id'],
                    'quantity' => $ingredient['quantity'] ?? 1,
                    'unit_cost' => $ingredient['unit_cost'] ?? 0,
                    'notes' => $ingredient['notes'] ?? null,
                ]);
            }

            $recipe->update(['estimated_cost' => $estimatedCost]);

            return $recipe->load(['product', 'ingredients.ingredientProduct']);
        });
    }

    public function createReservation(array $payload, int $businessId): TableReservation
    {
        return DB::transaction(function () use ($payload, $businessId) {
            if (!empty($payload['table_id'])) {
                $table = RestaurantTable::where('business_id', $businessId)->findOrFail($payload['table_id']);
                $table->update(['status' => 'reserved']);
            }

            return TableReservation::create([
                ...$payload,
                'business_id' => $businessId,
                'status' => $payload['status'] ?? 'reserved',
            ]);
        });
    }

    public function createTicket(array $payload, int $businessId): RestaurantTicket
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $items = collect($payload['items'] ?? []);
            $recipeCards = RecipeCard::query()
                ->where('business_id', $businessId)
                ->whereIn('product_id', $items->pluck('product_id')->all())
                ->get()
                ->keyBy('product_id');

            $products = Product::query()
                ->where('business_id', $businessId)
                ->whereIn('id', $items->pluck('product_id')->all())
                ->get()
                ->keyBy('id');

            $subtotal = 0;
            $recipeCostTotal = 0;

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                $linePrice = (float) ($item['unit_price'] ?? $product?->selling_price ?? 0) * (float) ($item['quantity'] ?? 1);
                $subtotal += $linePrice;

                $recipeCard = $recipeCards->get($item['product_id']);
                $recipeCostTotal += (float) ($recipeCard?->estimated_cost ?? $product?->cost_price ?? 0) * (float) ($item['quantity'] ?? 1);
            }

            $serviceCharge = (float) ($payload['service_charge'] ?? 0);
            $deliveryFee = (float) ($payload['delivery_fee'] ?? 0);
            $total = $subtotal + $serviceCharge + $deliveryFee;

            $ticket = RestaurantTicket::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'table_id' => $payload['table_id'] ?? null,
                'customer_id' => $payload['customer_id'] ?? null,
                'waiter_shift_id' => $payload['waiter_shift_id'] ?? null,
                'ticket_number' => $this->generateTicketNumber($businessId),
                'order_channel' => $payload['order_channel'] ?? 'dine_in',
                'service_status' => 'open',
                'payment_status' => 'unpaid',
                'guest_name' => $payload['guest_name'] ?? null,
                'delivery_address' => $payload['delivery_address'] ?? null,
                'split_count' => max((int) ($payload['split_count'] ?? 1), 1),
                'subtotal' => $subtotal,
                'service_charge' => $serviceCharge,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'amount_paid' => $payload['amount_paid'] ?? 0,
                'recipe_cost_total' => $recipeCostTotal,
                'gross_margin' => $total - $recipeCostTotal,
                'opened_at' => now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                $recipeCard = $recipeCards->get($item['product_id']);

                RestaurantTicketItem::create([
                    'business_id' => $businessId,
                    'restaurant_ticket_id' => $ticket->id,
                    'product_id' => $item['product_id'],
                    'course_name' => $item['course_name'] ?? null,
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $item['unit_price'] ?? $product?->selling_price ?? 0,
                    'recipe_cost' => $recipeCard?->estimated_cost ?? $product?->cost_price ?? 0,
                    'service_status' => 'queued',
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            KitchenTicket::create([
                'business_id' => $businessId,
                'restaurant_ticket_id' => $ticket->id,
                'status' => 'queued',
                'priority' => $payload['priority'] ?? 'normal',
                'station' => $payload['station'] ?? 'hot-kitchen',
                'notes' => $payload['kitchen_notes'] ?? null,
            ]);

            if (!empty($payload['table_id'])) {
                RestaurantTable::where('business_id', $businessId)
                    ->whereKey($payload['table_id'])
                    ->update(['status' => 'occupied']);
            }

            if (!empty($payload['waiter_shift_id'])) {
                RestaurantWaiterShift::where('business_id', $businessId)
                    ->whereKey($payload['waiter_shift_id'])
                    ->increment('orders_handled');
            }

            return $ticket->load(['items.product', 'table', 'waiterShift', 'kitchenTicket']);
        });
    }

    public function updateKitchenStatus(RestaurantTicket $ticket, array $payload): RestaurantTicket
    {
        return DB::transaction(function () use ($ticket, $payload) {
            $status = $payload['status'];
            $kitchenTicket = $ticket->kitchenTicket;

            $kitchenTicket?->update([
                'status' => $status,
                'fired_at' => $status === 'preparing' ? now() : $kitchenTicket?->fired_at,
                'ready_at' => $status === 'ready' ? now() : $kitchenTicket?->ready_at,
                'served_at' => $status === 'served' ? now() : $kitchenTicket?->served_at,
                'station' => $payload['station'] ?? $kitchenTicket?->station,
                'notes' => $payload['notes'] ?? $kitchenTicket?->notes,
            ]);

            $ticket->update([
                'service_status' => match ($status) {
                    'preparing' => 'preparing',
                    'ready' => 'ready',
                    'served' => 'served',
                    default => $ticket->service_status,
                },
            ]);

            $ticket->items()->update([
                'service_status' => $status,
            ]);

            return $ticket->fresh(['items.product', 'table', 'waiterShift', 'kitchenTicket']);
        });
    }

    public function closeTicket(RestaurantTicket $ticket, array $payload = []): RestaurantTicket
    {
        return DB::transaction(function () use ($ticket, $payload) {
            $amountPaid = (float) ($payload['amount_paid'] ?? $ticket->amount_paid);
            $wasteCostTotal = (float) ($payload['waste_cost_total'] ?? $ticket->waste_cost_total);

            $ticket->update([
                'service_status' => 'closed',
                'payment_status' => $amountPaid >= (float) $ticket->total ? 'paid' : 'part_paid',
                'amount_paid' => $amountPaid,
                'waste_cost_total' => $wasteCostTotal,
                'gross_margin' => (float) $ticket->total - (float) $ticket->recipe_cost_total - $wasteCostTotal,
                'closed_at' => now(),
            ]);

            $ticket->kitchenTicket?->update([
                'status' => 'served',
                'served_at' => $ticket->kitchenTicket?->served_at ?? now(),
            ]);

            if ($ticket->table_id) {
                $ticket->table()->update(['status' => 'available']);
            }

            return $ticket->fresh(['items.product', 'table', 'waiterShift', 'kitchenTicket']);
        });
    }

    public function logWaste(array $payload, int $businessId): FoodWasteLog
    {
        return FoodWasteLog::create([
            ...$payload,
            'business_id' => $businessId,
            'logged_at' => $payload['logged_at'] ?? now(),
        ]);
    }

    private function generateShiftCode(int $businessId): string
    {
        return 'WTR-' . $businessId . '-' . strtoupper(str()->random(6));
    }

    private function generateTicketNumber(int $businessId): string
    {
        return 'RST-' . $businessId . '-' . strtoupper(str()->random(6));
    }
}
