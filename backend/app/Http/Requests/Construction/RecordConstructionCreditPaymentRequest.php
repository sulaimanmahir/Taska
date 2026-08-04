<?php

namespace App\Http\Requests\Construction;

use Illuminate\Foundation\Http\FormRequest;

class RecordConstructionCreditPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'in:cash,transfer,bank,card,wallet'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
