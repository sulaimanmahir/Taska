<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FarmInputLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'planting_cycle_id' => $this->planting_cycle_id,
            'input_type' => $this->input_type,
            'input_name' => $this->input_name,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'cost' => $this->cost,
            'applied_on' => $this->applied_on?->toDateString(),
            'notes' => $this->notes,
            'planting_cycle' => $this->whenLoaded('plantingCycle', fn () => [
                'id' => $this->plantingCycle?->id,
                'crop_name' => $this->plantingCycle?->crop_name,
                'status' => $this->plantingCycle?->status,
                'plot' => $this->plantingCycle?->relationLoaded('plot') ? [
                    'id' => $this->plantingCycle?->plot?->id,
                    'name' => $this->plantingCycle?->plot?->name,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
