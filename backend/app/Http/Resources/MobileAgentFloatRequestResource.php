<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MobileAgentFloatRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'staff_id' => $this->staff_id,
            'agent_name' => $this->agent_name,
            'requested_amount' => $this->requested_amount,
            'approved_amount' => $this->approved_amount,
            'status' => $this->status,
            'reason' => $this->reason,
            'requested_at' => $this->requested_at?->toJSON(),
            'approved_at' => $this->approved_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
