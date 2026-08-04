<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MobileAgentShortageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'staff_id' => $this->staff_id,
            'agent_name' => $this->agent_name,
            'shortage_amount' => $this->shortage_amount,
            'recovered_amount' => $this->recovered_amount,
            'status' => $this->status,
            'reason' => $this->reason,
            'logged_at' => $this->logged_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
