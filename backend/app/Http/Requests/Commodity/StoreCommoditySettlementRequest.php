<?php

namespace App\Http\Requests\Commodity;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommoditySettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'party_type' => ['required', 'in:supplier,customer'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'in:cash,transfer,bank,card,wallet'],
            'settled_on' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
