<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LivestockBreedingRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'animal_group_id' => $this->animal_group_id,
            'cycle_name' => $this->cycle_name,
            'paired_count' => $this->paired_count,
            'successful_births' => $this->successful_births,
            'expected_delivery_date' => $this->expected_delivery_date?->toDateString(),
            'actual_delivery_date' => $this->actual_delivery_date?->toDateString(),
            'status' => $this->status,
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'species' => $this->group?->species,
                'animal_count' => $this->group?->animal_count,
                'status' => $this->group?->status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
