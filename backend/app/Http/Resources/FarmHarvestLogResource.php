<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FarmHarvestLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'planting_cycle_id' => $this->planting_cycle_id,
            'quantity_harvested' => $this->quantity_harvested,
            'unit' => $this->unit,
            'estimated_revenue' => $this->estimated_revenue,
            'loss_quantity' => $this->loss_quantity,
            'harvested_on' => $this->harvested_on?->toDateString(),
            'notes' => $this->notes,
            'planting_cycle' => $this->whenLoaded('plantingCycle', fn () => [
                'id' => $this->plantingCycle?->id,
                'crop_name' => $this->plantingCycle?->crop_name,
                'status' => $this->plantingCycle?->status,
                'actual_harvest_date' => $this->plantingCycle?->actual_harvest_date?->toDateString(),
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
