<?php

namespace App\Http\Requests\Customers;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
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
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'customer_group_id' => [
                'nullable',
                'integer',
                Rule::exists('customer_groups', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'credit_limit' => 'nullable|numeric|min:0',
            'customer_type' => 'nullable|in:individual,retailer,wholesaler',
        ];
    }
}
