<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccessAuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actor_name' => $this->whenLoaded('actor', fn () => $this->actor?->name, 'System'),
            'action' => $this->action,
            'subject_type' => $this->subject_type,
            'subject_label' => $this->subject_label,
            'changes' => $this->changes,
            'created_at' => $this->created_at?->toJSON(),
        ];
    }
}
