<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddActiveBusinessTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $availableTypes = array_keys(config('business_types.types', []));

        return [
            'business_type' => ['required', 'string', Rule::in($availableTypes)],
        ];
    }
}
