<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GrainMillingBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'batch_number' => $this->batch_number,
            'milling_date' => $this->milling_date?->toDateString(),
            'status' => $this->status,
            'grain_type' => $this->grain_type,
            'input_quantity_kg' => $this->input_quantity_kg,
            'output_quantity_kg' => $this->output_quantity_kg,
            'byproduct_quantity_kg' => $this->byproduct_quantity_kg,
            'wastage_quantity_kg' => $this->wastage_quantity_kg,
            'labour_cost' => $this->labour_cost,
            'electricity_cost' => $this->electricity_cost,
            'packaging_cost' => $this->packaging_cost,
            'total_cost' => $this->totalCost(),
            'yield_percent' => $this->yieldPercent(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
