<?php

namespace App\Http\Requests\Retail;

use Illuminate\Foundation\Http\FormRequest;

class RefundRetailOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'refund_amount' => ['nullable', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'in:cash,transfer,credit,card,wallet'],
            'reason' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
