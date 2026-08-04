<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralCommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'agent' => $this->whenLoaded('agent', fn () => [
                'id' => $this->agent->id,
                'name' => $this->agent->full_name,
                'referral_code' => $this->agent->referral_code,
            ]),
            'referred_business' => $this->whenLoaded('referredBusiness', fn () => [
                'id' => $this->referredBusiness->id,
                'name' => $this->referredBusiness->name,
            ]),
            'type' => $this->type,
            'status' => $this->status,
            'amount' => $this->amount,
            'rate_applied' => $this->rate_applied,
            'currency' => $this->currency,
            'description' => $this->description,
            'approved_at' => $this->approved_at?->toJSON(),
            'paid_at' => $this->paid_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
