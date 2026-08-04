<?php

namespace App\Http\Requests\Referrals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReferralPayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'agent_id' => [
                'required',
                Rule::exists('referral_agents', 'id')->where(fn ($query) => $query->where(
                    'business_id',
                    $this->user()?->current_business_id
                )),
            ],
            'amount' => ['required', 'numeric', 'min:1'],
        ];
    }
}
