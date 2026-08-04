<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFarmInputLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'planting_cycle_id' => [
                'required',
                Rule::exists('farm_planting_cycles', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'input_type' => ['required', 'string', 'max:255'],
            'input_name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'unit' => ['nullable', 'string', 'max:50'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'applied_on' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
