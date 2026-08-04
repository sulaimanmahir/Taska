<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SMEFollowUpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'customer_id' => $this->customer_id,
            'assigned_to' => $this->assigned_to,
            'category' => $this->category,
            'status' => $this->status,
            'title' => $this->title,
            'notes' => $this->notes,
            'amount_in_focus' => $this->amount_in_focus,
            'due_on' => $this->due_on?->toDateString(),
            'completed_at' => $this->completed_at?->toJSON(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
