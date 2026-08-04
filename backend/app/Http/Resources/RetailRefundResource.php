<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RetailRefundResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'order_id' => $this->order_id,
            'customer_id' => $this->customer_id,
            'processed_by' => $this->processed_by,
            'refund_number' => $this->refund_number,
            'status' => $this->status,
            'refund_amount' => $this->refund_amount,
            'payment_method' => $this->payment_method,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'refunded_at' => $this->refunded_at?->toJSON(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'order_number' => $this->order?->order_number,
                'order_type' => $this->order?->order_type,
                'status' => $this->order?->status,
                'total' => $this->order?->total,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
