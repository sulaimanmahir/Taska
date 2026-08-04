<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FarmPlantingCycleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'plot_id' => $this->plot_id,
            'crop_name' => $this->crop_name,
            'season_name' => $this->season_name,
            'planting_date' => $this->planting_date?->toDateString(),
            'expected_harvest_date' => $this->expected_harvest_date?->toDateString(),
            'actual_harvest_date' => $this->actual_harvest_date?->toDateString(),
            'planted_area_hectares' => $this->planted_area_hectares,
            'status' => $this->status,
            'notes' => $this->notes,
            'plot' => $this->whenLoaded('plot', fn () => [
                'id' => $this->plot?->id,
                'name' => $this->plot?->name,
                'location' => $this->plot?->location,
                'size_hectares' => $this->plot?->size_hectares,
                'soil_type' => $this->plot?->soil_type,
                'status' => $this->plot?->status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
