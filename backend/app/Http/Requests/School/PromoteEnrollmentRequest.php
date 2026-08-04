<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class PromoteEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:promoted,repeat,graduated'],
        ];
    }
}
