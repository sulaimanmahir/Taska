<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryVehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'assigned_user_id' => $this->assigned_user_id,
            'vehicle_type' => $this->vehicle_type,
            'ownership_model' => $this->ownership_model,
            'plate_number' => $this->plate_number,
            'owner_name' => $this->owner_name,
            'owner_details' => $this->owner_details,
            'purchase_value' => $this->purchase_value,
            'fuel_responsibility' => $this->fuel_responsibility,
            'maintenance_responsibility' => $this->maintenance_responsibility,
            'is_active' => $this->is_active,
            'orders_count' => $this->whenCounted('orders'),
            'assigned_rider' => $this->whenLoaded('assignedRider', fn () => [
                'id' => $this->assignedRider?->id,
                'name' => $this->assignedRider?->name,
                'email' => $this->assignedRider?->email,
            ]),
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch?->id,
                'name' => $this->branch?->name,
                'slug' => $this->branch?->slug,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
