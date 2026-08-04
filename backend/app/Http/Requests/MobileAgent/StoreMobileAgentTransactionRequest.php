<?php

namespace App\Http\Requests\MobileAgent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMobileAgentTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'branch_id' => ['nullable', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'staff_id' => ['nullable', Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
                $query->whereExists(function ($membershipQuery) use ($businessId) {
                    $membershipQuery
                        ->selectRaw('1')
                        ->from('business_user')
                        ->whereColumn('business_user.user_id', 'users.id')
                        ->where('business_user.business_id', $businessId)
                        ->where('business_user.status', 'active');
                });
            })],
            'commission_tier_id' => ['nullable', Rule::exists('mobile_agent_commission_tiers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'agent_name' => ['required', 'string', 'max:255'],
            'service_type' => ['required', 'in:cash_in,cash_out,transfer,bill_payment,airtime'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'transaction_amount' => ['required', 'numeric', 'min:0'],
            'cash_delta' => ['nullable', 'numeric'],
            'float_delta' => ['nullable', 'numeric'],
            'status' => ['nullable', 'in:completed,pending,reversal_pending,failed'],
            'notes' => ['nullable', 'string'],
            'flag_fraud' => ['nullable', 'boolean'],
        ];
    }
}
