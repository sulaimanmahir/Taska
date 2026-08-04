<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitializeBillingPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => [
                'required',
                Rule::exists('invoices', 'id')->where(fn ($query) => $query->where(
                    'business_id',
                    $this->user()?->current_business_id
                )),
            ],
            'gateway' => ['required', Rule::in(['paystack', 'flutterwave'])],
        ];
    }
}
