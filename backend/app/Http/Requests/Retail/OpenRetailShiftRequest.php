<?php

namespace App\Http\Requests\Retail;

use Illuminate\Foundation\Http\FormRequest;

class OpenRetailShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'opening_float' => ['required', 'numeric', 'min:0'],
        ];
    }
}
