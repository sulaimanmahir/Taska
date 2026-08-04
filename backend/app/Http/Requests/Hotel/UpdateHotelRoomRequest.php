<?php

namespace App\Http\Requests\Hotel;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHotelRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:available,reserved,occupied,cleaning,blocked,out_of_service'],
            'cleaning_status' => ['nullable', 'in:clean,dirty,in_progress,inspected'],
            'blocked_reason' => ['nullable', 'string'],
            'base_rate' => ['nullable', 'numeric', 'min:0'],
            'extra_guest_charge' => ['nullable', 'numeric', 'min:0'],
            'late_checkout_charge' => ['nullable', 'numeric', 'min:0'],
            'early_checkin_charge' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
