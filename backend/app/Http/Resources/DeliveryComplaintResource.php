<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryComplaintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'delivery_order_id' => $this->delivery_order_id,
            'created_by' => $this->created_by,
            'source' => $this->source,
            'category' => $this->category,
            'status' => $this->status,
            'summary' => $this->summary,
            'resolution_notes' => $this->resolution_notes,
            'resolved_at' => $this->resolved_at?->toJSON(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'tracking_code' => $this->order?->tracking_code,
                'status' => $this->order?->status,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
                'email' => $this->creator?->email,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
