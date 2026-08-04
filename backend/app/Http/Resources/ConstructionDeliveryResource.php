<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConstructionDeliveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'order_id' => $this->order_id,
            'quotation_id' => $this->quotation_id,
            'customer_id' => $this->customer_id,
            'delivery_mode' => $this->delivery_mode,
            'destination_type' => $this->destination_type,
            'driver_name' => $this->driver_name,
            'loader_name' => $this->loader_name,
            'vehicle_reference' => $this->vehicle_reference,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'delivery_address' => $this->delivery_address,
            'delivered_at' => $this->delivered_at?->toJSON(),
            'confirmed_by' => $this->confirmed_by,
            'created_by' => $this->created_by,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
                'balance' => $this->customer?->balance,
            ]),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'order_number' => $this->order?->order_number,
                'status' => $this->order?->status,
                'total' => $this->order?->total,
                'paid' => $this->order?->paid,
            ]),
            'quotation' => $this->whenLoaded('quotation', fn () => [
                'id' => $this->quotation?->id,
                'quotation_number' => $this->quotation?->quotation_number,
                'status' => $this->quotation?->status,
                'total' => $this->quotation?->total,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
