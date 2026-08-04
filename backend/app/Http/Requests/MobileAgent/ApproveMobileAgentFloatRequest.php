<?php

namespace App\Http\Requests\MobileAgent;

use Illuminate\Foundation\Http\FormRequest;

class ApproveMobileAgentFloatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'approved_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
