<?php

namespace App\Http\Requests\Retail;

use Illuminate\Foundation\Http\FormRequest;

class CloseRetailShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'actual_cash' => ['required', 'numeric', 'min:0'],
        ];
    }
}
