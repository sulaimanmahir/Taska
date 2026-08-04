<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
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

        foreach (['slug', 'description', 'address'] as $field) {
            if ($this->has($field)) {
                $payload[$field] = $this->normalizeNullableString($this->input($field));
            }
        }

        $this->merge($payload);
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;
        $warehouseId = $this->route('warehouse')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('warehouses', 'slug')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($warehouseId),
            ],
            'branch_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
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
