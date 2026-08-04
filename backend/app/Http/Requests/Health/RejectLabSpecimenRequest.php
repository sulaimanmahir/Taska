<?php

namespace App\Http\Requests\Health;

use Illuminate\Foundation\Http\FormRequest;

class RejectLabSpecimenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string'],
        ];
    }
}
