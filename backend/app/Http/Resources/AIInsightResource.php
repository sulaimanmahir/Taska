<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AIInsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'type' => $this->type,
            'severity' => $this->severity,
            'title' => $this->title,
            'description' => $this->description,
            'recommendation' => $this->recommendation,
            'data' => $this->data,
            'is_read' => $this->is_read,
            'is_dismissed' => $this->is_dismissed,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
