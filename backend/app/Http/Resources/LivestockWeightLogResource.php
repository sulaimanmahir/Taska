<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LivestockWeightLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'animal_group_id' => $this->animal_group_id,
            'weight_kg' => $this->weight_kg,
            'sample_size' => $this->sample_size,
            'weighed_at' => $this->weighed_at?->toJSON(),
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'species' => $this->group?->species,
                'breed' => $this->group?->breed,
                'animal_count' => $this->group?->animal_count,
                'average_weight_kg' => $this->group?->average_weight_kg,
                'status' => $this->group?->status,
                'pen' => $this->group?->relationLoaded('pen') ? [
                    'id' => $this->group?->pen?->id,
                    'name' => $this->group?->pen?->name,
                    'section' => $this->group?->pen?->section,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
