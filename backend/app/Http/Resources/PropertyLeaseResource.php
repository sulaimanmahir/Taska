<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyLeaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'property_unit_id' => $this->property_unit_id,
            'property_unit_code' => $this->whenLoaded('propertyUnit', fn () => $this->propertyUnit?->unit_code),
            'property_name' => $this->whenLoaded('propertyUnit', fn () => $this->propertyUnit?->property_name),
            'customer_id' => $this->customer_id,
            'customer_name' => $this->whenLoaded('customer', fn () => $this->customer?->name),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'rent_amount' => $this->rent_amount,
            'service_charge_amount' => $this->service_charge_amount,
            'payment_frequency_days' => $this->payment_frequency_days,
            'deposit_amount' => $this->deposit_amount,
            'balance' => $this->balance,
            'next_due_date' => $this->next_due_date?->toDateString(),
            'status' => $this->status,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
