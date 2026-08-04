<?php

namespace App\Http\Requests\Expenses;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'expense_category_id' => [
                'required',
                'integer',
                Rule::exists('expense_categories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'description' => 'required|string|max:500',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,transfer,bank',
            'reference' => 'nullable|string',
            'expense_date' => 'required|date',
        ];
    }
}
