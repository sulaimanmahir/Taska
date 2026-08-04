<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryManifestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'vehicle_id' => $this->vehicle_id,
            'rider_id' => $this->rider_id,
            'created_by' => $this->created_by,
            'manifest_code' => $this->manifest_code,
            'title' => $this->title,
            'status' => $this->status,
            'dispatched_at' => $this->dispatched_at?->toJSON(),
            'closed_at' => $this->closed_at?->toJSON(),
            'notes' => $this->notes,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle?->id,
                'vehicle_type' => $this->vehicle?->vehicle_type,
                'plate_number' => $this->vehicle?->plate_number,
            ]),
            'rider' => $this->whenLoaded('rider', fn () => [
                'id' => $this->rider?->id,
                'name' => $this->rider?->name,
                'email' => $this->rider?->email,
            ]),
            'orders' => $this->whenLoaded('orders', fn () => $this->orders->map(fn ($order) => [
                'id' => $order->id,
                'tracking_code' => $order->tracking_code,
                'status' => $order->status,
                'sender' => $order->relationLoaded('sender') ? [
                    'id' => $order->sender?->id,
                    'name' => $order->sender?->name,
                ] : null,
                'recipient' => $order->relationLoaded('recipient') ? [
                    'id' => $order->recipient?->id,
                    'name' => $order->recipient?->name,
                ] : null,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
