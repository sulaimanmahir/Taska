<?php

namespace App\Http\Requests\Construction;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConstructionDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending_dispatch,dispatched,in_transit,delivered,failed,cancelled'],
            'failure_reason' => ['nullable', 'string', 'max:255'],
            'confirmed_by' => ['nullable', 'string', 'max:255'],
        ];
    }
}
