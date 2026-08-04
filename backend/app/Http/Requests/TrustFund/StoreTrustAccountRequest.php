<?php

namespace App\Http\Requests\TrustFund;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTrustAccountRequest extends FormRequest
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
                'required',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'account_type' => 'required|in:credit,contribution',
            'limit' => 'required|numeric|min:0',
            'cycle_name' => 'nullable|string|max:120',
            'installment_amount' => 'nullable|numeric|min:0',
            'contribution_frequency_days' => 'nullable|integer|min:1|max:365',
            'next_due_date' => 'nullable|date',
        ];
    }
}
