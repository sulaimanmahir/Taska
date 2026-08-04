<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'subscription_id' => $this->subscription_id,
            'invoice_number' => $this->invoice_number,
            'type' => $this->type,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'total' => $this->total,
            'currency' => $this->currency,
            'status' => $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'paid_at' => $this->paid_at?->toJSON(),
            'payment_method' => $this->payment_method,
            'gateway_reference' => $this->gateway_reference,
            'notes' => $this->notes,
            'plan' => $this->whenLoaded('subscription', fn () => $this->subscription?->plan?->name),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
