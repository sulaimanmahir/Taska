<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgroFarmerCreditRecoveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'customer_id' => $this->customer_id,
            'recovery_reference' => $this->recovery_reference,
            'region_name' => $this->region_name,
            'credit_amount' => $this->credit_amount,
            'recovered_amount' => $this->recovered_amount,
            'outstanding_amount' => $this->outstanding_amount,
            'due_date' => $this->due_date?->toDateString(),
            'last_contacted_at' => $this->last_contacted_at?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
                'balance' => $this->customer?->balance,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
