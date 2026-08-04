<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'booking_id' => $this->booking_id,
            'customer_id' => $this->customer_id,
            'offering_id' => $this->offering_id,
            'staff_profile_id' => $this->staff_profile_id,
            'status' => $this->status,
            'quoted_amount' => $this->quoted_amount,
            'invoice_amount' => $this->invoice_amount,
            'amount_paid' => $this->amount_paid,
            'due_date' => $this->due_date?->toDateString(),
            'started_at' => $this->started_at?->toJSON(),
            'completed_at' => $this->completed_at?->toJSON(),
            'notes' => $this->notes,
            'booking' => $this->whenLoaded('booking', fn () => [
                'id' => $this->booking?->id,
                'status' => $this->booking?->status,
                'scheduled_for' => $this->booking?->scheduled_for?->toJSON(),
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
                'balance' => $this->customer?->balance,
            ]),
            'offering' => $this->whenLoaded('offering', fn () => [
                'id' => $this->offering?->id,
                'name' => $this->offering?->name,
                'category' => $this->offering?->category,
                'base_price' => $this->offering?->base_price,
            ]),
            'staff_profile' => $this->whenLoaded('staffProfile', fn () => [
                'id' => $this->staffProfile?->id,
                'name' => $this->staffProfile?->name,
                'specialty' => $this->staffProfile?->specialty,
                'phone' => $this->staffProfile?->phone,
                'is_active' => $this->staffProfile?->is_active,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
