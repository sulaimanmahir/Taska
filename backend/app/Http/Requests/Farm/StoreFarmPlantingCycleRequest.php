<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFarmPlantingCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'plot_id' => [
                'required',
                Rule::exists('farm_plots', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'crop_name' => ['required', 'string', 'max:255'],
            'season_name' => ['nullable', 'string', 'max:255'],
            'planting_date' => ['required', 'date'],
            'expected_harvest_date' => ['nullable', 'date'],
            'planted_area_hectares' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:planned,planted,growing,harvested'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
