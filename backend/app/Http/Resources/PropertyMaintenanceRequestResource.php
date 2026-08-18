<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyMaintenanceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'property_unit_id' => $this->property_unit_id,
            'property_unit_code' => $this->whenLoaded('propertyUnit', fn () => $this->propertyUnit?->unit_code),
            'title' => $this->title,
            'details' => $this->details,
            'priority' => $this->priority,
            'status' => $this->status,
            'resolved_at' => $this->resolved_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
        ];
    }
}
