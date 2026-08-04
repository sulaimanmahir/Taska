<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuelNozzleReadingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'fuel_pump_id' => $this->fuel_pump_id,
            'attendant_name' => $this->attendant_name,
            'shift_name' => $this->shift_name,
            'reading_date' => $this->reading_date?->toDateString(),
            'opening_reading' => $this->opening_reading,
            'closing_reading' => $this->closing_reading,
            'litres_sold' => $this->litres_sold,
            'unit_price' => $this->unit_price,
            'expected_sales_amount' => $this->expected_sales_amount,
            'recorded_sales_amount' => $this->recorded_sales_amount,
            'cash_reported' => $this->cash_reported,
            'variance_amount' => $this->variance_amount,
            'status' => $this->status,
            'pump' => $this->whenLoaded('pump', fn () => [
                'id' => $this->pump?->id,
                'name' => $this->pump?->name,
                'code' => $this->pump?->code,
                'attendant_name' => $this->pump?->attendant_name,
                'meter_reading_current' => $this->pump?->meter_reading_current,
                'tank' => $this->pump?->relationLoaded('tank') ? [
                    'id' => $this->pump?->tank?->id,
                    'name' => $this->pump?->tank?->name,
                    'fuel_type' => $this->pump?->tank?->fuel_type,
                    'current_stock_litres' => $this->pump?->tank?->current_stock_litres,
                    'price_per_litre' => $this->pump?->tank?->price_per_litre,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
