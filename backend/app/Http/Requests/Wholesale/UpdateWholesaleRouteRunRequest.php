<?php

namespace App\Http\Requests\Wholesale;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWholesaleRouteRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:planned,in_progress,completed,cancelled'],
            'actual_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
