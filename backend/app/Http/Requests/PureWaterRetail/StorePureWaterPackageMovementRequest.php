<?php

namespace App\Http\Requests\PureWaterRetail;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePureWaterPackageMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'warehouse_id' => ['nullable', 'integer', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'movement_type' => ['required', 'in:restock,wastage,adjustment_in,adjustment_out'],
            'package_type' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'units_per_package' => ['nullable', 'numeric', 'min:0.001'],
            'sales_channel' => ['nullable', 'in:retail,wholesale'],
            'notes' => ['nullable', 'string'],
            'recorded_at' => ['nullable', 'date'],
        ];
    }
}
