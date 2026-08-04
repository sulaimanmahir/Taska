<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
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
            'status' => ['required', 'string', Rule::in(['active', 'suspended'])],
        ];
    }
}
