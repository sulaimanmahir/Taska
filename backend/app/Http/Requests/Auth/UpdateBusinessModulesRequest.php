<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $business = $this->user()?->currentBusiness;
        $availableModules = $business
            ? config("business_types.types.{$business->business_type}.modules", [])
            : [];

        return [
            'modules' => ['required', 'array'],
            'modules.*' => ['string', Rule::in($availableModules)],
        ];
    }
}
