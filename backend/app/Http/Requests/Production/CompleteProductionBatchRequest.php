<?php

namespace App\Http\Requests\Production;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteProductionBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'warehouse_id' => [
                'nullable',
                'integer',
                Rule::exists('warehouses', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'damaged_quantity' => ['nullable', 'numeric', 'min:0'],
            'wastage_quantity' => ['nullable', 'numeric', 'min:0'],
            'leakage_losses' => ['nullable', 'numeric', 'min:0'],
            'torn_sacks' => ['nullable', 'numeric', 'min:0'],
            'damaged_nylon' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
