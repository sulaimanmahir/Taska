<?php

namespace App\Http\Requests\Referrals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReferralAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'bank_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'account_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'account_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bank_code' => ['sometimes', 'nullable', 'string', 'max:255'],
            'payment_method' => ['sometimes', Rule::in(['bank_transfer', 'wallet'])],
        ];
    }
}
