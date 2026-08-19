<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->whenLoaded('branch', fn () => $this->branch?->name),
            'action_type' => $this->action_type,
            'summary' => $this->summary,
            'status' => $this->status,
            'requested_by' => $this->whenLoaded('requester', fn () => [
                'id' => $this->requester?->id,
                'name' => $this->requester?->name,
            ]),
            'decided_by' => $this->whenLoaded('decider', fn () => $this->decider ? [
                'id' => $this->decider->id,
                'name' => $this->decider->name,
            ] : null),
            'decided_at' => $this->decided_at?->toJSON(),
            'decline_reason' => $this->decline_reason,
            'created_at' => $this->created_at?->toJSON(),
        ];
    }
}
