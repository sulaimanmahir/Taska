<?php

namespace App\Http\Requests\Livestock;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLivestockWeightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'animal_group_id' => [
                'required',
                Rule::exists('livestock_animal_groups', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'weight_kg' => ['required', 'numeric', 'min:0'],
            'sample_size' => ['nullable', 'integer', 'min:1'],
            'weighed_at' => ['nullable', 'date'],
        ];
    }
}
