<?php

namespace App\Http\Requests\Referrals;

use App\Models\ReferralAgent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReferralAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'agent_type' => ['required', Rule::in([
                ReferralAgent::TYPE_RESELLER,
                ReferralAgent::TYPE_AFFILIATE,
                ReferralAgent::TYPE_INTRODUCER,
            ])],
        ];
    }
}
