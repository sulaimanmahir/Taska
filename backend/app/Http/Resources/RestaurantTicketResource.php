<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'table_id' => $this->table_id,
            'customer_id' => $this->customer_id,
            'waiter_shift_id' => $this->waiter_shift_id,
            'ticket_number' => $this->ticket_number,
            'order_channel' => $this->order_channel,
            'service_status' => $this->service_status,
            'payment_status' => $this->payment_status,
            'guest_name' => $this->guest_name,
            'delivery_address' => $this->delivery_address,
            'split_count' => $this->split_count,
            'subtotal' => $this->subtotal,
            'service_charge' => $this->service_charge,
            'delivery_fee' => $this->delivery_fee,
            'total' => $this->total,
            'amount_paid' => $this->amount_paid,
            'recipe_cost_total' => $this->recipe_cost_total,
            'gross_margin' => $this->gross_margin,
            'waste_cost_total' => $this->waste_cost_total,
            'opened_at' => $this->opened_at?->toJSON(),
            'closed_at' => $this->closed_at?->toJSON(),
            'notes' => $this->notes,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'business_id' => $item->business_id,
                'restaurant_ticket_id' => $item->restaurant_ticket_id,
                'product_id' => $item->product_id,
                'course_name' => $item->course_name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'recipe_cost' => $item->recipe_cost,
                'service_status' => $item->service_status,
                'notes' => $item->notes,
                'product' => $item->relationLoaded('product') ? [
                    'id' => $item->product?->id,
                    'name' => $item->product?->name,
                    'sku' => $item->product?->sku,
                    'selling_price' => $item->product?->selling_price,
                ] : null,
                'created_at' => $item->created_at?->toJSON(),
                'updated_at' => $item->updated_at?->toJSON(),
            ])->values()),
            'table' => $this->whenLoaded('table', fn () => [
                'id' => $this->table?->id,
                'name' => $this->table?->name,
                'zone' => $this->table?->zone,
                'seats' => $this->table?->seats,
                'status' => $this->table?->status,
            ]),
            'waiter_shift' => $this->whenLoaded('waiterShift', fn () => [
                'id' => $this->waiterShift?->id,
                'staff_name' => $this->waiterShift?->staff_name,
                'shift_code' => $this->waiterShift?->shift_code,
                'status' => $this->waiterShift?->status,
                'orders_handled' => $this->waiterShift?->orders_handled,
            ]),
            'kitchen_ticket' => $this->whenLoaded('kitchenTicket', fn () => [
                'id' => $this->kitchenTicket?->id,
                'status' => $this->kitchenTicket?->status,
                'priority' => $this->kitchenTicket?->priority,
                'station' => $this->kitchenTicket?->station,
                'fired_at' => $this->kitchenTicket?->fired_at?->toJSON(),
                'ready_at' => $this->kitchenTicket?->ready_at?->toJSON(),
                'served_at' => $this->kitchenTicket?->served_at?->toJSON(),
                'notes' => $this->kitchenTicket?->notes,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
