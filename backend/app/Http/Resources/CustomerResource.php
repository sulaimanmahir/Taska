<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'customer_group_id' => $this->customer_group_id,
            'credit_limit' => $this->credit_limit,
            'balance' => $this->balance,
            'customer_type' => $this->customer_type,
            'is_active' => $this->is_active,
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'slug' => $this->group?->slug,
                'discount_percent' => $this->group?->discount_percent,
            ]),
            'orders' => $this->whenLoaded('orders', fn () => $this->orders->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_type' => $order->order_type,
                'status' => $order->status,
                'total' => $order->total,
                'paid' => $order->paid,
                'created_at' => $order->created_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
