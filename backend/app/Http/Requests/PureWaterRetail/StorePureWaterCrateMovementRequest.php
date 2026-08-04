<?php

namespace App\Http\Requests\PureWaterRetail;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePureWaterCrateMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'product_id' => ['nullable', 'integer', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'movement_type' => ['required', 'in:issue,return,adjustment_in,adjustment_out'],
            'crate_count' => ['required', 'numeric', 'min:0.001'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'recorded_at' => ['nullable', 'date'],
        ];
    }
}
