<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HotelBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'room_id' => $this->room_id,
            'reservation_code' => $this->reservation_code,
            'guest_name' => $this->guest_name,
            'guest_phone' => $this->guest_phone,
            'guest_email' => $this->guest_email,
            'status' => $this->status,
            'check_in_date' => $this->check_in_date?->toDateString(),
            'check_out_date' => $this->check_out_date?->toDateString(),
            'actual_check_in_at' => $this->actual_check_in_at?->toJSON(),
            'actual_check_out_at' => $this->actual_check_out_at?->toJSON(),
            'adults' => $this->adults,
            'extra_guests' => $this->extra_guests,
            'is_repeat_guest' => $this->is_repeat_guest,
            'payment_method' => $this->payment_method,
            'room_rate' => $this->room_rate,
            'extra_guest_charge_total' => $this->extra_guest_charge_total,
            'late_checkout_charge_total' => $this->late_checkout_charge_total,
            'early_checkin_charge_total' => $this->early_checkin_charge_total,
            'total_amount' => $this->total_amount,
            'amount_paid' => $this->amount_paid,
            'notes' => $this->notes,
            'room' => $this->whenLoaded('room', fn () => [
                'id' => $this->room?->id,
                'room_number' => $this->room?->room_number,
                'category' => $this->room?->category,
                'status' => $this->room?->status,
                'cleaning_status' => $this->room?->cleaning_status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
