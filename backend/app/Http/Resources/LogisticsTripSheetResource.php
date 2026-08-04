<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogisticsTripSheetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'fleet_asset_id' => $this->fleet_asset_id,
            'driver_id' => $this->driver_id,
            'trip_code' => $this->trip_code,
            'job_type' => $this->job_type,
            'customer_name' => $this->customer_name,
            'route_name' => $this->route_name,
            'origin' => $this->origin,
            'destination' => $this->destination,
            'trip_date' => $this->trip_date?->toDateString(),
            'status' => $this->status,
            'expected_revenue' => $this->expected_revenue,
            'actual_revenue' => $this->actual_revenue,
            'distance_km' => $this->distance_km,
            'expected_fuel_cost' => $this->expected_fuel_cost,
            'actual_fuel_cost' => $this->actual_fuel_cost,
            'loading_cost' => $this->loading_cost,
            'driver_allowance' => $this->driver_allowance,
            'maintenance_cost' => $this->maintenance_cost,
            'other_cost' => $this->other_cost,
            'profit_estimate' => $this->profit_estimate,
            'payment_status' => $this->payment_status,
            'notes' => $this->notes,
            'departed_at' => $this->departed_at?->toJSON(),
            'arrived_at' => $this->arrived_at?->toJSON(),
            'asset' => $this->whenLoaded('asset', fn () => [
                'id' => $this->asset?->id,
                'name' => $this->asset?->name,
                'plate_number' => $this->asset?->plate_number,
                'ownership_model' => $this->asset?->ownership_model,
            ]),
            'driver' => $this->whenLoaded('driver', fn () => [
                'id' => $this->driver?->id,
                'name' => $this->driver?->name,
                'email' => $this->driver?->email,
            ]),
            'stops' => $this->whenLoaded('stops', fn () => $this->stops->map(fn ($stop) => [
                'id' => $stop->id,
                'customer_id' => $stop->customer_id,
                'stop_order' => $stop->stop_order,
                'stop_name' => $stop->stop_name,
                'location' => $stop->location,
                'status' => $stop->status,
                'expected_revenue' => $stop->expected_revenue,
                'actual_revenue' => $stop->actual_revenue,
                'notes' => $stop->notes,
            ])->values()),
            'settlement' => $this->whenLoaded('settlement', fn () => $this->settlement ? [
                'id' => $this->settlement->id,
                'status' => $this->settlement->status,
                'gross_revenue' => $this->settlement->gross_revenue,
                'trip_cost' => $this->settlement->trip_cost,
                'driver_payout' => $this->settlement->driver_payout,
                'company_retained' => $this->settlement->company_retained,
                'fuel_deduction' => $this->settlement->fuel_deduction,
                'maintenance_deduction' => $this->settlement->maintenance_deduction,
                'settled_at' => $this->settlement->settled_at?->toJSON(),
            ] : null),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
