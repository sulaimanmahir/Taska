<?php

namespace App\Http\Requests\PropertyManagement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyLeaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'property_unit_id' => ['required', Rule::exists('property_units', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'customer_id' => ['required', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'rent_amount' => ['required', 'numeric', 'min:0'],
            'service_charge_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_frequency_days' => ['nullable', 'integer', 'min:1'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
