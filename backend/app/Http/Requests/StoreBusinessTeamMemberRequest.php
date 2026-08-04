<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBusinessTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => is_string($this->name) ? trim($this->name) : $this->name,
            'email' => is_string($this->email) ? trim($this->email) : $this->email,
            'phone' => is_string($this->phone) ? trim($this->phone) : $this->phone,
            'password' => is_string($this->password) ? trim($this->password) : $this->password,
        ]);
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'role_slug' => [
                'required',
                'string',
                Rule::exists('roles', 'slug')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'branch_id' => [
                'required',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $email = $this->input('email');

            if (!$email || User::where('email', $email)->exists()) {
                return;
            }

            if (!$this->filled('password')) {
                $validator->errors()->add('password', 'Initial password is required when creating a brand-new login.');
            }
        });
    }
}
