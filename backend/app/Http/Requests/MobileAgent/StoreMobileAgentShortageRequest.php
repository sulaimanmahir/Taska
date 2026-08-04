<?php

namespace App\Http\Requests\MobileAgent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMobileAgentShortageRequest extends FormRequest
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
            'agent_name' => ['required', 'string', 'max:255'],
            'shortage_amount' => ['required', 'numeric', 'min:0'],
            'recovered_amount' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
