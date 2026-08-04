<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SMEDailyTargetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'target_date' => $this->target_date?->toDateString(),
            'sales_target' => $this->sales_target,
            'collection_target' => $this->collection_target,
            'expense_limit' => $this->expense_limit,
            'actual_sales' => $this->actual_sales,
            'actual_collections' => $this->actual_collections,
            'actual_expenses' => $this->actual_expenses,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
