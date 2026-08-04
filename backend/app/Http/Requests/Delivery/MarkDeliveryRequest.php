<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class MarkDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string'],
            'proof_url' => ['nullable', 'string', 'max:255'],
            'amount_remitted' => ['nullable', 'numeric', 'min:0'],
            'offline' => ['nullable', 'array'],
        ];
    }
}
