<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuelShiftLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'staff_id' => $this->staff_id,
            'attendant_name' => $this->attendant_name,
            'shift_name' => $this->shift_name,
            'opened_at' => $this->opened_at?->toJSON(),
            'closed_at' => $this->closed_at?->toJSON(),
            'cash_expected' => $this->cash_expected,
            'cash_reported' => $this->cash_reported,
            'shortage_amount' => $this->shortage_amount,
            'recovery_amount' => $this->recovery_amount,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
