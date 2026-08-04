<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MobileAgentReversalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'mobile_agent_transaction_id' => $this->mobile_agent_transaction_id,
            'reason' => $this->reason,
            'status' => $this->status,
            'amount' => $this->amount,
            'requested_at' => $this->requested_at?->toJSON(),
            'resolved_at' => $this->resolved_at?->toJSON(),
            'resolution_notes' => $this->resolution_notes,
            'transaction' => $this->whenLoaded('transaction', fn () => [
                'id' => $this->transaction?->id,
                'agent_name' => $this->transaction?->agent_name,
                'service_type' => $this->transaction?->service_type,
                'status' => $this->transaction?->status,
                'transaction_reference' => $this->transaction?->transaction_reference,
                'transaction_amount' => $this->transaction?->transaction_amount,
                'commission_amount' => $this->transaction?->commission_amount,
                'closing_float_balance' => $this->transaction?->closing_float_balance,
                'is_reversal_requested' => $this->transaction?->is_reversal_requested,
                'processed_at' => $this->transaction?->processed_at?->toJSON(),
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
