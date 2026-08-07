<?php

namespace App\Http\Requests\LivestockMarket;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLivestockMarketTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'transaction_type' => ['required', 'string', Rule::in(['intake', 'sale'])],
            'animal_type' => ['required', 'string', Rule::in(['cattle', 'goat', 'sheep', 'camel', 'poultry', 'other'])],
            'head_count' => ['required', 'integer', 'min:1'],
            'total_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'unit_price_per_kg' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0.01'],
            'counterparty_name' => ['required', 'string', 'max:255'],
            'counterparty_phone' => ['nullable', 'string', 'max:50'],
            'market_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
