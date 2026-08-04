<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WholesaleRouteRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'sales_rep_id' => $this->sales_rep_id,
            'route_name' => $this->route_name,
            'status' => $this->status,
            'route_date' => $this->route_date?->toDateString(),
            'vehicle_reference' => $this->vehicle_reference,
            'target_amount' => $this->target_amount,
            'actual_amount' => $this->actual_amount,
            'notes' => $this->notes,
            'sales_rep' => $this->whenLoaded('salesRep', fn () => [
                'id' => $this->salesRep?->id,
                'name' => $this->salesRep?->name,
                'phone' => $this->salesRep?->phone,
                'territory' => $this->salesRep?->territory,
                'status' => $this->salesRep?->status,
            ]),
            'stops' => $this->whenLoaded('stops', fn () => $this->stops->map(fn ($stop) => [
                'id' => $stop->id,
                'route_run_id' => $stop->route_run_id,
                'customer_id' => $stop->customer_id,
                'order_id' => $stop->order_id,
                'stop_name' => $stop->stop_name,
                'status' => $stop->status,
                'expected_amount' => $stop->expected_amount,
                'collected_amount' => $stop->collected_amount,
                'notes' => $stop->notes,
                'customer' => $stop->relationLoaded('customer') ? [
                    'id' => $stop->customer?->id,
                    'name' => $stop->customer?->name,
                    'phone' => $stop->customer?->phone,
                ] : null,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
