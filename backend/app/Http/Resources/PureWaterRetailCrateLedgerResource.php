<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PureWaterRetailCrateLedgerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'customer_id' => $this->customer_id,
            'product_id' => $this->product_id,
            'movement_type' => $this->movement_type,
            'crate_count' => $this->crate_count,
            'deposit_amount' => $this->deposit_amount,
            'balance_after' => $this->balance_after,
            'recorded_by' => $this->recorded_by,
            'notes' => $this->notes,
            'recorded_at' => $this->recorded_at?->toJSON(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'sku' => $this->product?->sku,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
