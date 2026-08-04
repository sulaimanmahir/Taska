<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SettleDeliveryOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'fuel_deduction' => ['nullable', 'numeric', 'min:0'],
            'maintenance_deduction' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['pending', 'approved', 'paid'])],
        ];
    }
}
