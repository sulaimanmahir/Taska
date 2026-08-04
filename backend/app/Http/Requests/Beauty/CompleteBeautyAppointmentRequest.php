<?php

namespace App\Http\Requests\Beauty;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteBeautyAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'service_price' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'product_usages' => ['nullable', 'array'],
            'product_usages.*.product_id' => [
                'nullable',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'product_usages.*.product_name' => ['nullable', 'string', 'max:255'],
            'product_usages.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'product_usages.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}
