<?php

namespace App\Http\Requests\Production;

use Illuminate\Foundation\Http\FormRequest;

class AdjustRawMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric'],
            'type' => ['required', 'in:add,remove,set'],
        ];
    }
}
