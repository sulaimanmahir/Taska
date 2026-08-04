<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliverySettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'delivery_order_id' => $this->delivery_order_id,
            'vehicle_id' => $this->vehicle_id,
            'rider_id' => $this->rider_id,
            'status' => $this->status,
            'total_delivery_fee' => $this->total_delivery_fee,
            'rider_share' => $this->rider_share,
            'owner_share' => $this->owner_share,
            'company_share' => $this->company_share,
            'fuel_deduction' => $this->fuel_deduction,
            'maintenance_deduction' => $this->maintenance_deduction,
            'net_rider_payout' => $this->net_rider_payout,
            'net_owner_payout' => $this->net_owner_payout,
            'company_retained_earnings' => $this->company_retained_earnings,
            'settled_at' => $this->settled_at?->toJSON(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'tracking_code' => $this->order->tracking_code,
                'status' => $this->order->status,
            ]),
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'registration_number' => $this->vehicle?->registration_number,
                'owner_name' => $this->vehicle?->owner_name,
            ]),
            'rider' => $this->whenLoaded('rider', fn () => [
                'id' => $this->rider?->id,
                'name' => $this->rider?->name,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
