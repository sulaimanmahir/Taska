<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TailoringJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'style_order_id' => $this->style_order_id,
            'assigned_tailor' => $this->assigned_tailor,
            'stage' => $this->stage,
            'priority' => $this->priority,
            'started_at' => $this->started_at?->toJSON(),
            'completed_at' => $this->completed_at?->toJSON(),
            'notes' => $this->notes,
            'style_order' => $this->whenLoaded('styleOrder', fn () => [
                'id' => $this->styleOrder?->id,
                'order_number' => $this->styleOrder?->order_number,
                'style_name' => $this->styleOrder?->style_name,
                'garment_type' => $this->styleOrder?->garment_type,
                'status' => $this->styleOrder?->status,
                'total_amount' => $this->styleOrder?->total_amount,
                'amount_paid' => $this->styleOrder?->amount_paid,
                'due_date' => $this->styleOrder?->due_date?->toDateString(),
                'customer' => $this->styleOrder?->relationLoaded('customer') ? [
                    'id' => $this->styleOrder?->customer?->id,
                    'name' => $this->styleOrder?->customer?->name,
                    'phone' => $this->styleOrder?->customer?->phone,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
