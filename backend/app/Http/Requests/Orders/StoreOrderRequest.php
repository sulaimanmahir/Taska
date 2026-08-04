<?php

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'items.*.variant_id' => [
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
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'paid' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,transfer,credit,card,wallet',
            'notes' => 'nullable|string',
        ];
    }
}
