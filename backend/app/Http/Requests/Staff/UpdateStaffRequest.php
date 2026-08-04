<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'role' => 'nullable|string|max:100',
            'branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'employment_type' => 'nullable|in:full_time,part_time,contract',
            'salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,terminated',
        ];
    }
}
