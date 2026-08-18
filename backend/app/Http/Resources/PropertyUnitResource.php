<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyUnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'unit_code' => $this->unit_code,
            'property_name' => $this->property_name,
            'unit_type' => $this->unit_type,
            'address' => $this->address,
            'bedrooms' => $this->bedrooms,
            'rent_amount' => $this->rent_amount,
            'service_charge_amount' => $this->service_charge_amount,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
