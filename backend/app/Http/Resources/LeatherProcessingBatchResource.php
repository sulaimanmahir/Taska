<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeatherProcessingBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'batch_number' => $this->batch_number,
            'processing_date' => $this->processing_date?->toDateString(),
            'status' => $this->status,
            'hide_type' => $this->hide_type,
            'input_hide_count' => $this->input_hide_count,
            'input_weight_kg' => $this->input_weight_kg,
            'output_sqft' => $this->output_sqft,
            'reject_count' => $this->reject_count,
            'tanning_chemical_cost' => $this->tanning_chemical_cost,
            'labour_cost' => $this->labour_cost,
            'other_cost' => $this->other_cost,
            'total_cost' => $this->totalCost(),
            'reject_rate_percent' => $this->rejectRatePercent(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
