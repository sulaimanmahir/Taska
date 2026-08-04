<?php

namespace App\Http\Requests\GeneralSME;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSMECashEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'customer_id' => ['nullable', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'entry_type' => 'required|in:cash_in,cash_out',
            'source' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|in:cash,transfer,card,wallet',
            'reference' => 'nullable|string|max:255',
            'entry_date' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }
}
