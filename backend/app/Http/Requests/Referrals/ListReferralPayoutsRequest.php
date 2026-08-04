<?php

namespace App\Http\Requests\Referrals;

use App\Models\ReferralPayout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListReferralPayoutsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'agent_id' => [
                'sometimes',
                Rule::exists('referral_agents', 'id')->where(fn ($query) => $query->where(
                    'business_id',
                    $this->user()?->current_business_id
                )),
            ],
            'status' => ['sometimes', Rule::in([
                ReferralPayout::STATUS_PENDING,
                ReferralPayout::STATUS_PROCESSING,
                ReferralPayout::STATUS_COMPLETED,
                ReferralPayout::STATUS_FAILED,
                ReferralPayout::STATUS_CANCELLED,
            ])],
        ];
    }
}
