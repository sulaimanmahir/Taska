<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'balance' => $this->balance,
            'contact_person' => $this->contact_person,
            'is_active' => $this->is_active,
            'purchases' => $this->whenLoaded('purchases', fn () => $this->purchases->map(fn ($purchase) => [
                'id' => $purchase->id,
                'reference' => $purchase->reference,
                'status' => $purchase->status,
                'total_amount' => $purchase->total_amount,
                'received_amount' => $purchase->received_amount,
                'paid_amount' => $purchase->paid_amount,
                'created_at' => $purchase->created_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
