<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MobileAgentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'staff_id' => $this->staff_id,
            'commission_tier_id' => $this->commission_tier_id,
            'agent_name' => $this->agent_name,
            'service_type' => $this->service_type,
            'transaction_reference' => $this->transaction_reference,
            'transaction_amount' => $this->transaction_amount,
            'commission_amount' => $this->commission_amount,
            'cash_delta' => $this->cash_delta,
            'float_delta' => $this->float_delta,
            'closing_float_balance' => $this->closing_float_balance,
            'status' => $this->status,
            'is_reversal_requested' => $this->is_reversal_requested,
            'notes' => $this->notes,
            'processed_at' => $this->processed_at?->toJSON(),
            'commission_tier' => $this->whenLoaded('commissionTier', fn () => [
                'id' => $this->commissionTier?->id,
                'name' => $this->commissionTier?->name,
                'service_type' => $this->commissionTier?->service_type,
                'minimum_volume' => $this->commissionTier?->minimum_volume,
                'maximum_volume' => $this->commissionTier?->maximum_volume,
                'commission_rate' => $this->commissionTier?->commission_rate,
                'flat_bonus' => $this->commissionTier?->flat_bonus,
                'is_active' => $this->commissionTier?->is_active,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
