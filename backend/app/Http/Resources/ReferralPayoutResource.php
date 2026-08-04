<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralPayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payout_number' => $this->payout_number,
            'agent_id' => $this->agent_id,
            'agent' => $this->whenLoaded('agent', fn () => [
                'id' => $this->agent->id,
                'name' => $this->agent->full_name,
                'referral_code' => $this->agent->referral_code,
            ]),
            'amount' => $this->amount,
            'fees' => $this->fees,
            'net_amount' => $this->net_amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'bank_name' => $this->bank_name,
            'account_number' => $this->account_number ? '****' . substr($this->account_number, -4) : null,
            'account_name' => $this->account_name,
            'gateway_reference' => $this->gateway_reference,
            'failure_reason' => $this->failure_reason,
            'processed_at' => $this->processed_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
