<?php

namespace App\Http\Requests\GrainMilling;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGrainMillingBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'milling_date' => ['required', 'date'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'grain_type' => ['required', 'string', Rule::in(['maize', 'rice', 'sorghum', 'millet', 'wheat', 'groundnut', 'other'])],
            'input_quantity_kg' => ['required', 'numeric', 'min:0.01'],
            'output_quantity_kg' => ['nullable', 'numeric', 'min:0'],
            'byproduct_quantity_kg' => ['nullable', 'numeric', 'min:0'],
            'wastage_quantity_kg' => ['nullable', 'numeric', 'min:0'],
            'labour_cost' => ['nullable', 'numeric', 'min:0'],
            'electricity_cost' => ['nullable', 'numeric', 'min:0'],
            'packaging_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
