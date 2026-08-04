<?php

namespace App\Http\Requests\Billing;

use App\Models\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in([PaymentMethod::TYPE_CARD, PaymentMethod::TYPE_BANK])],
            'provider' => ['required', Rule::in(['paystack', 'flutterwave'])],
            'gateway_token' => ['required', 'string'],
            'last_four' => ['required_if:type,card', 'nullable', 'string', 'max:10'],
            'brand' => ['required_if:type,card', 'nullable', 'string', 'max:255'],
            'expiry_month' => ['required_if:type,card', 'nullable', 'integer', 'between:1,12'],
            'expiry_year' => ['required_if:type,card', 'nullable', 'integer', 'min:' . now()->year],
            'bank_name' => ['required_if:type,bank', 'nullable', 'string', 'max:255'],
            'account_number' => ['required_if:type,bank', 'nullable', 'string', 'max:255'],
            'account_name' => ['required_if:type,bank', 'nullable', 'string', 'max:255'],
            'bank_code' => ['required_if:type,bank', 'nullable', 'string', 'max:255'],
        ];
    }
}
