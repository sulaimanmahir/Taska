<?php

namespace App\Http\Requests\Agro;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAgroSubsidySaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'branch_id' => ['nullable', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'customer_id' => ['nullable', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'product_id' => ['nullable', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'programme_name' => ['required', 'string', 'max:255'],
            'agency_name' => ['nullable', 'string', 'max:255'],
            'region_name' => ['nullable', 'string', 'max:255'],
            'season_name' => ['nullable', 'string', 'max:255'],
            'input_category' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'subsidy_amount' => ['nullable', 'numeric', 'min:0'],
            'amount_due' => ['nullable', 'numeric', 'min:0'],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
            'sale_date' => ['required', 'date'],
        ];
    }
}
