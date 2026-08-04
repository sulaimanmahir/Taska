<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'product_id' => $this->product_id,
            'batch_number' => $this->batch_number,
            'manufacture_date' => $this->manufacture_date?->toDateString(),
            'expiry_date' => $this->expiry_date?->toDateString(),
            'quantity' => $this->quantity,
            'remaining_quantity' => $this->remaining_quantity,
            'cost_per_unit' => $this->cost_per_unit,
            'near_expiry_discount_percent' => $this->near_expiry_discount_percent,
            'discounted_price' => $this->discounted_price,
            'supplier' => $this->supplier,
            'notes' => $this->notes,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'is_controlled_drug' => $this->product?->is_controlled_drug,
                'allow_substitution' => $this->product?->allow_substitution,
            ]),
            'movements' => $this->whenLoaded('movements', fn () => $this->movements->map(fn ($movement) => [
                'id' => $movement->id,
                'movement_type' => $movement->movement_type,
                'quantity' => $movement->quantity,
                'reference_type' => $movement->reference_type,
                'reference_id' => $movement->reference_id,
                'notes' => $movement->notes,
                'created_at' => $movement->created_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
