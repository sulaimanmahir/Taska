<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LivestockMilkLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'animal_group_id' => $this->animal_group_id,
            'litres' => $this->litres,
            'recorded_on' => $this->recorded_on?->toDateString(),
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'species' => $this->group?->species,
                'average_weight_kg' => $this->group?->average_weight_kg,
                'status' => $this->group?->status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
