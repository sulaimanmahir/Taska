<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PharmacyDispenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'customer_id' => $this->customer_id,
            'product_id' => $this->product_id,
            'product_batch_id' => $this->product_batch_id,
            'substituted_from_product_id' => $this->substituted_from_product_id,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'total_amount' => $this->total_amount,
            'prescription_reference' => $this->prescription_reference,
            'refill_due' => $this->refill_due,
            'dispensed_at' => $this->dispensed_at?->toJSON(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'is_controlled_drug' => $this->product?->is_controlled_drug,
                'refill_cycle_days' => $this->product?->refill_cycle_days,
            ]),
            'batch' => $this->whenLoaded('batch', fn () => [
                'id' => $this->batch?->id,
                'batch_number' => $this->batch?->batch_number,
                'expiry_date' => $this->batch?->expiry_date?->toDateString(),
                'remaining_quantity' => $this->batch?->remaining_quantity,
            ]),
            'substituted_from' => $this->whenLoaded('substitutedFrom', fn () => [
                'id' => $this->substitutedFrom?->id,
                'name' => $this->substitutedFrom?->name,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
