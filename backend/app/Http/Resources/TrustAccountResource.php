<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrustAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'customer_id' => $this->customer_id,
            'account_type' => $this->account_type,
            'cycle_name' => $this->cycle_name,
            'limit' => $this->limit,
            'installment_amount' => $this->installment_amount,
            'contribution_frequency_days' => $this->contribution_frequency_days,
            'balance' => $this->balance,
            'total_repaid' => $this->total_repaid,
            'last_payment_date' => $this->last_payment_date?->toDateString(),
            'next_due_date' => $this->next_due_date?->toDateString(),
            'status' => $this->status,
            'available_credit' => $this->availableCredit(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
                'email' => $this->customer?->email,
                'balance' => $this->customer?->balance,
            ]),
            'recommendation' => $this->when(
                $this->resource->offsetExists('recommendation') || isset($this->recommendation),
                $this->recommendation
            ),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
