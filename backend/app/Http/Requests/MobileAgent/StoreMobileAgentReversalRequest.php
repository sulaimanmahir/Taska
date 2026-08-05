<?php

namespace App\Http\Requests\MobileAgent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMobileAgentReversalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'mobile_agent_transaction_id' => [
                'required',
                'integer',
                Rule::exists('mobile_agent_transactions', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'reason' => ['required', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'resolution_notes' => ['nullable', 'string'],
        ];
    }
}
