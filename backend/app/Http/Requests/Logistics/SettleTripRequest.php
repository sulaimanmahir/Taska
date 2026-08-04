<?php

namespace App\Http\Requests\Logistics;

use Illuminate\Foundation\Http\FormRequest;

class SettleTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'gross_revenue' => ['nullable', 'numeric', 'min:0'],
            'trip_cost' => ['nullable', 'numeric', 'min:0'],
            'driver_payout' => ['nullable', 'numeric', 'min:0'],
            'company_retained' => ['nullable', 'numeric', 'min:0'],
            'fuel_deduction' => ['nullable', 'numeric', 'min:0'],
            'maintenance_deduction' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:pending,approved,paid'],
        ];
    }
}
