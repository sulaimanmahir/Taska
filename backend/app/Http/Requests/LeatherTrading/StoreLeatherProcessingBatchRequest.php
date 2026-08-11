<?php

namespace App\Http\Requests\LeatherTrading;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeatherProcessingBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'processing_date' => ['required', 'date'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'hide_type' => ['required', 'string', Rule::in(['cattle', 'goat', 'sheep', 'camel', 'other'])],
            'input_hide_count' => ['required', 'integer', 'min:1'],
            'input_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'output_sqft' => ['nullable', 'numeric', 'min:0'],
            'reject_count' => ['nullable', 'integer', 'min:0'],
            'tanning_chemical_cost' => ['nullable', 'numeric', 'min:0'],
            'labour_cost' => ['nullable', 'numeric', 'min:0'],
            'other_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
