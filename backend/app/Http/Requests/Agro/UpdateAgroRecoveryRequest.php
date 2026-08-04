<?php

namespace App\Http\Requests\Agro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgroRecoveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'credit_amount' => ['nullable', 'numeric', 'min:0'],
            'recovered_amount' => ['nullable', 'numeric', 'min:0'],
            'last_contacted_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:open,under_review,recovered,defaulted'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
