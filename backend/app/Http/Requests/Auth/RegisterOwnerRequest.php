<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterOwnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $visibleBusinessTypes = array_values(array_diff(
            array_keys(config('business_types.types', [])),
            ['ngo_warehouse']
        ));

        return [
            'business_name' => ['required', 'string', 'max:255'],
            'business_email' => ['required', 'email', 'unique:businesses,email'],
            'business_type' => ['required', 'string', Rule::in($visibleBusinessTypes)],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string'],
            'role' => ['nullable', 'string', Rule::in(collect(config('business_types.roles', []))->pluck('slug')->all())],
            'subscription_plan_id' => ['nullable', 'exists:subscription_plans,id'],
        ];
    }
}
