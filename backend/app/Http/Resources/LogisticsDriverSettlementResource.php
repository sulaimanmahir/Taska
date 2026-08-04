<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogisticsDriverSettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'trip_sheet_id' => $this->trip_sheet_id,
            'driver_id' => $this->driver_id,
            'gross_revenue' => $this->gross_revenue,
            'trip_cost' => $this->trip_cost,
            'driver_payout' => $this->driver_payout,
            'company_retained' => $this->company_retained,
            'fuel_deduction' => $this->fuel_deduction,
            'maintenance_deduction' => $this->maintenance_deduction,
            'status' => $this->status,
            'settled_at' => $this->settled_at?->toJSON(),
            'trip' => $this->whenLoaded('trip', fn () => [
                'id' => $this->trip?->id,
                'trip_code' => $this->trip?->trip_code,
                'route_name' => $this->trip?->route_name,
                'status' => $this->trip?->status,
            ]),
            'driver' => $this->whenLoaded('driver', fn () => [
                'id' => $this->driver?->id,
                'name' => $this->driver?->name,
                'email' => $this->driver?->email,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
