<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RetailCashierShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'opened_by' => $this->opened_by,
            'closed_by' => $this->closed_by,
            'shift_code' => $this->shift_code,
            'status' => $this->status,
            'opening_float' => $this->opening_float,
            'cash_sales_total' => $this->cash_sales_total,
            'petty_cash_total' => $this->petty_cash_total,
            'refund_total' => $this->refund_total,
            'expected_cash' => $this->expected_cash,
            'actual_cash' => $this->actual_cash,
            'variance_amount' => $this->variance_amount,
            'opened_at' => $this->opened_at?->toJSON(),
            'closed_at' => $this->closed_at?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
