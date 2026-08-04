<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'supplier_id' => ['required', 'integer', $this->businessOwnedRule('suppliers', $businessId)],
            'warehouse_id' => ['required', 'integer', $this->businessOwnedRule('warehouses', $businessId)],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', $this->businessOwnedRule('products', $businessId)],
            'items.*.variant_id' => ['nullable', 'integer', $this->businessOwnedRule('product_variants', $businessId)],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
