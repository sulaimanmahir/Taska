<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BeautyAppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'customer_id' => $this->customer_id,
            'service_id' => $this->service_id,
            'staff_profile_id' => $this->staff_profile_id,
            'appointment_at' => $this->appointment_at?->toJSON(),
            'status' => $this->status,
            'service_price' => $this->service_price,
            'commission_amount' => $this->commission_amount,
            'product_cost' => $this->product_cost,
            'notes' => $this->notes,
            'completed_at' => $this->completed_at?->toJSON(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service?->id,
                'name' => $this->service?->name,
                'category' => $this->service?->category,
                'price' => $this->service?->price,
                'commission_rate' => $this->service?->commission_rate,
            ]),
            'staff_profile' => $this->whenLoaded('staffProfile', fn () => [
                'id' => $this->staffProfile?->id,
                'name' => $this->staffProfile?->name,
                'specialty' => $this->staffProfile?->specialty,
                'phone' => $this->staffProfile?->phone,
                'commission_wallet' => $this->staffProfile?->commission_wallet,
            ]),
            'product_usages' => $this->whenLoaded('productUsages', fn () => $this->productUsages->map(fn ($usage) => [
                'id' => $usage->id,
                'product_id' => $usage->product_id,
                'product_name' => $usage->product_name,
                'quantity' => $usage->quantity,
                'unit_cost' => $usage->unit_cost,
                'total_cost' => $usage->total_cost,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
