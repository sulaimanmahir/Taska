<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $visibleBusinessTypes = array_values(array_diff(
            array_keys(config('business_types.types', [])),
            ['ngo_warehouse']
        ));

        return [
            'business_name' => ['required', 'string', 'max:255'],
            'business_email' => ['nullable', 'email', 'unique:businesses,email'],
            'business_type' => ['required', 'string', Rule::in($visibleBusinessTypes)],
            'business_category' => ['required', 'string', 'max:100'],
            'business_location' => ['required', 'string', 'max:255'],
            'primary_branch_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'subscription_plan_id' => ['nullable', 'exists:subscription_plans,id'],
            'billing_cycle' => ['nullable', Rule::in(['monthly', 'yearly'])],
        ];
    }
}
