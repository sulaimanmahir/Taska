<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $availableQuantity = $this->relationLoaded('inventoryItems')
            ? (float) $this->inventoryItems->sum('quantity')
            : (float) $this->inventoryItems()->sum('quantity');

        $stockStatus = $availableQuantity <= 0
            ? 'out_of_stock'
            : ($availableQuantity <= (float) ($this->low_stock_alert ?? 0) ? 'low_stock' : 'in_stock');

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'barcode' => $this->barcode,
            'product_type' => $this->product_type,
            'track_inventory' => $this->track_inventory,
            'cost_price' => $this->cost_price,
            'selling_price' => $this->selling_price,
            'min_price' => $this->min_price,
            'max_price' => $this->max_price,
            'low_stock_alert' => $this->low_stock_alert,
            'track_expiry' => $this->track_expiry,
            'is_prescription_required' => $this->is_prescription_required,
            'pharmacy_category' => $this->pharmacy_category,
            'default_expiry_months' => $this->default_expiry_months,
            'generic_product_id' => $this->generic_product_id,
            'medicine_type' => $this->medicine_type,
            'is_controlled_drug' => $this->is_controlled_drug,
            'allow_substitution' => $this->allow_substitution,
            'refill_cycle_days' => $this->refill_cycle_days,
            'is_active' => $this->is_active,
            'available_quantity' => $availableQuantity,
            'stock_status' => $stockStatus,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ]),
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($variant) => [
                'id' => $variant->id,
                'name' => $variant->name,
                'sku' => $variant->sku,
                'price_adjustment' => $variant->price_adjustment,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
