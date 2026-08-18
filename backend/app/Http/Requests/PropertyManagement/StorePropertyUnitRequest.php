<?php

namespace App\Http\Requests\PropertyManagement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'property_name' => ['required', 'string', 'max:255'],
            'unit_type' => ['required', 'string', Rule::in(['apartment', 'shop', 'office', 'duplex', 'warehouse', 'land', 'other'])],
            'address' => ['nullable', 'string', 'max:255'],
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'rent_amount' => ['required', 'numeric', 'min:0'],
            'service_charge_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
