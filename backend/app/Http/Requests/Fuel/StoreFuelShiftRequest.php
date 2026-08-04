<?php

namespace App\Http\Requests\Fuel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFuelShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'branch_id' => ['nullable', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'staff_id' => ['nullable', Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'attendant_name' => ['required', 'string', 'max:255'],
            'shift_name' => ['required', 'string', 'max:100'],
            'opened_at' => ['nullable', 'date'],
            'closed_at' => ['nullable', 'date'],
            'cash_expected' => ['nullable', 'numeric', 'min:0'],
            'cash_reported' => ['nullable', 'numeric', 'min:0'],
            'recovery_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:open,closed,review'],
        ];
    }
}
