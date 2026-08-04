<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConstructionCreditPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'credit_account_id' => $this->credit_account_id,
            'business_id' => $this->business_id,
            'amount' => $this->amount,
            'payment_date' => $this->payment_date?->toDateString(),
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'recorded_by' => $this->recorded_by,
            'account' => $this->whenLoaded('account', fn () => [
                'id' => $this->account?->id,
                'customer_id' => $this->account?->customer_id,
                'order_id' => $this->account?->order_id,
                'due_date' => $this->account?->due_date?->toDateString(),
                'total_amount' => $this->account?->total_amount,
                'paid_amount' => $this->account?->paid_amount,
                'outstanding_amount' => $this->account?->outstanding_amount,
                'debt_age_bucket' => $this->account?->debt_age_bucket,
                'status' => $this->account?->status,
                'customer' => $this->account?->relationLoaded('customer') ? [
                    'id' => $this->account?->customer?->id,
                    'name' => $this->account?->customer?->name,
                    'balance' => $this->account?->customer?->balance,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
