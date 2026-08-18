<?php

namespace App\Http\Requests\PropertyManagement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyMaintenanceRequestRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
            'priority' => ['nullable', 'string', Rule::in(['low', 'normal', 'high', 'urgent'])],
        ];
    }
}
