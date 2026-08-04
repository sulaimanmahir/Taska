<?php

namespace App\Http\Requests\Pharmacy;

use Illuminate\Foundation\Http\FormRequest;

class ApplyBatchDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'near_expiry_discount_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'discounted_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
