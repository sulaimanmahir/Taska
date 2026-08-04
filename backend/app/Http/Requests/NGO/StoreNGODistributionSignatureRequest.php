<?php

namespace App\Http\Requests\NGO;

use Illuminate\Foundation\Http\FormRequest;

class StoreNGODistributionSignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'beneficiary_name' => ['required', 'string', 'max:255'],
            'signed_by' => ['required', 'string', 'max:255'],
            'signature_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
