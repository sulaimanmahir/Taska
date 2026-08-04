<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string',
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('product_categories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'low_stock_alert' => 'nullable|integer|min:0',
            'track_inventory' => 'nullable|in:yes,no',
            'product_type' => 'nullable|in:good,service,digital',
        ];
    }
}
