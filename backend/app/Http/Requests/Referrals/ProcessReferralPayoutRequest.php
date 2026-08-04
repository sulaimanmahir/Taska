<?php

namespace App\Http\Requests\Referrals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProcessReferralPayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'gateway' => ['required', Rule::in(['paystack', 'flutterwave'])],
        ];
    }
}
