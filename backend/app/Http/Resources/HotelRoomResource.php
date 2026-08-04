<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HotelRoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'room_number' => $this->room_number,
            'category' => $this->category,
            'floor' => $this->floor,
            'status' => $this->status,
            'cleaning_status' => $this->cleaning_status,
            'base_rate' => $this->base_rate,
            'extra_guest_charge' => $this->extra_guest_charge,
            'late_checkout_charge' => $this->late_checkout_charge,
            'early_checkin_charge' => $this->early_checkin_charge,
            'blocked_reason' => $this->blocked_reason,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
