<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'monthly_price' => $this->monthly_price,
            'yearly_price' => $this->yearly_price,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'display_order' => $this->display_order,
            'features' => $this->whenLoaded('features', fn () => $this->features->map(fn ($feature) => [
                'id' => $feature->id,
                'key' => $feature->feature_key,
                'name' => $feature->feature_name,
                'value_type' => $feature->value_type,
                'value' => $feature->value,
                'sort_order' => $feature->sort_order,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
