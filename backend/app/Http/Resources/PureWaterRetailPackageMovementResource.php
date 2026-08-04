<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PureWaterRetailPackageMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'customer_id' => $this->customer_id,
            'movement_type' => $this->movement_type,
            'package_type' => $this->package_type,
            'quantity' => $this->quantity,
            'units_per_package' => $this->units_per_package,
            'unit_equivalent_quantity' => $this->unit_equivalent_quantity,
            'sales_channel' => $this->sales_channel,
            'reference_order_id' => $this->reference_order_id,
            'recorded_by' => $this->recorded_by,
            'notes' => $this->notes,
            'recorded_at' => $this->recorded_at?->toJSON(),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'sku' => $this->product?->sku,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'warehouse' => $this->whenLoaded('warehouse', fn () => [
                'id' => $this->warehouse?->id,
                'name' => $this->warehouse?->name,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
