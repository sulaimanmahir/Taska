<?php

namespace App\Http\Requests\TrustFund;

use Illuminate\Foundation\Http\FormRequest;

class DrawTrustAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:1',
            'reference' => 'nullable|string',
        ];
    }
}
