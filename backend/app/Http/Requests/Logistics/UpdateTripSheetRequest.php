<?php

namespace App\Http\Requests\Logistics;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTripSheetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:planned,dispatched,in_transit,completed,cancelled'],
            'actual_revenue' => ['nullable', 'numeric', 'min:0'],
            'actual_fuel_cost' => ['nullable', 'numeric', 'min:0'],
            'loading_cost' => ['nullable', 'numeric', 'min:0'],
            'driver_allowance' => ['nullable', 'numeric', 'min:0'],
            'maintenance_cost' => ['nullable', 'numeric', 'min:0'],
            'other_cost' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'in:pending,partial,paid'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
