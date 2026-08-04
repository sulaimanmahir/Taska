<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RawMaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'warehouse_id' => $this->warehouse_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'unit' => $this->unit,
            'material_category' => $this->material_category,
            'quantity' => $this->quantity,
            'cost_per_unit' => $this->cost_per_unit,
            'reorder_level' => $this->reorder_level,
            'description' => $this->description,
            'supplier_name' => $this->supplier_name,
            'supplier_phone' => $this->supplier_phone,
            'supplier_balance' => $this->supplier_balance,
            'last_purchase_cost' => $this->last_purchase_cost,
            'low_stock_threshold' => $this->low_stock_threshold,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
