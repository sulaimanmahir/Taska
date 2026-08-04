<?php

namespace App\Http\Requests\Referrals;

use App\Models\ReferralCommission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListReferralCommissionsRequest extends FormRequest
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
                ReferralCommission::STATUS_PENDING,
                ReferralCommission::STATUS_APPROVED,
                ReferralCommission::STATUS_PAID,
                ReferralCommission::STATUS_CANCELLED,
            ])],
            'type' => ['sometimes', Rule::in([
                ReferralCommission::TYPE_FIRST_PURCHASE,
                ReferralCommission::TYPE_RECURRING,
                ReferralCommission::TYPE_BONUS,
            ])],
        ];
    }
}
