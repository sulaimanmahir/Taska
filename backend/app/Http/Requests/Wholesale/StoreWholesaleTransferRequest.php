<?php

namespace App\Http\Requests\Wholesale;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWholesaleTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'from_warehouse_id' => [
                'required',
                'integer',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'to_warehouse_id' => [
                'required',
                'different:from_warehouse_id',
                'integer',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'variant_id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where(function ($query) use ($businessId) {
                    $query->whereIn('product_id', function ($subQuery) use ($businessId) {
                        $subQuery->select('id')
                            ->from('products')
                            ->where('business_id', $businessId);
                    });
                }),
            ],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
