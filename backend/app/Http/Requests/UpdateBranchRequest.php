<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('name')) {
            $payload['name'] = is_string($this->name) ? trim($this->name) : $this->name;
        }

        foreach (['slug', 'phone', 'address', 'city', 'state'] as $field) {
            if ($this->has($field)) {
                $payload[$field] = $this->normalizeNullableString($this->input($field));
            }
        }

        $this->merge($payload);
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;
        $branchId = $this->route('branch')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('branches', 'slug')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($branchId),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'state' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_primary' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
