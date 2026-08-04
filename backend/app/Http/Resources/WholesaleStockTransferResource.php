<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WholesaleStockTransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'quantity' => $this->quantity,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'from_warehouse' => $this->whenLoaded('fromWarehouse', fn () => [
                'id' => $this->fromWarehouse?->id,
                'name' => $this->fromWarehouse?->name,
            ]),
            'to_warehouse' => $this->whenLoaded('toWarehouse', fn () => [
                'id' => $this->toWarehouse?->id,
                'name' => $this->toWarehouse?->name,
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
