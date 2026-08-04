<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class RecordRemittanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount_remitted' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'proof_url' => ['nullable', 'string', 'max:255'],
            'offline' => ['nullable', 'array'],
        ];
    }
}
