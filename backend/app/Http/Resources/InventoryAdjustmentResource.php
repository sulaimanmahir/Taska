<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'message' => 'Inventory adjusted',
            'item' => [
                'id' => $this->resource['item']->id,
                'business_id' => $this->resource['item']->business_id,
                'warehouse_id' => $this->resource['item']->warehouse_id,
                'product_id' => $this->resource['item']->product_id,
                'variant_id' => $this->resource['item']->variant_id,
                'quantity' => $this->resource['item']->quantity,
                'reserved_quantity' => $this->resource['item']->reserved_quantity,
                'reorder_point' => $this->resource['item']->reorder_point,
            ],
            'movement' => [
                'id' => $this->resource['movement']->id,
                'movement_type' => $this->resource['movement']->movement_type,
                'quantity' => $this->resource['movement']->quantity,
                'previous_quantity' => $this->resource['movement']->previous_quantity,
                'new_quantity' => $this->resource['movement']->new_quantity,
                'notes' => $this->resource['movement']->notes,
                'created_by' => $this->resource['movement']->created_by,
                'created_at' => $this->resource['movement']->created_at?->toJSON(),
            ],
        ];
    }
}
