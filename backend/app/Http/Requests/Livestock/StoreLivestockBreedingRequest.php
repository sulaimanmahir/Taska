<?php

namespace App\Http\Requests\Livestock;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLivestockBreedingRequest extends FormRequest
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
            'cycle_name' => ['required', 'string', 'max:255'],
            'paired_count' => ['nullable', 'integer', 'min:0'],
            'successful_births' => ['nullable', 'integer', 'min:0'],
            'expected_delivery_date' => ['nullable', 'date'],
            'actual_delivery_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ];
    }
}
