<?php

namespace App\Http\Requests\Fuel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFuelNozzleReadingRequest extends FormRequest
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
            'fuel_pump_id' => ['required', Rule::exists('fuel_pumps', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'attendant_name' => ['required', 'string', 'max:255'],
            'shift_name' => ['nullable', 'string', 'max:100'],
            'reading_date' => ['required', 'date'],
            'opening_reading' => ['nullable', 'numeric', 'min:0'],
            'closing_reading' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'recorded_sales_amount' => ['nullable', 'numeric', 'min:0'],
            'cash_reported' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
