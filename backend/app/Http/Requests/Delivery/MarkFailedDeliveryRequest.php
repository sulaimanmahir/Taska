<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class MarkFailedDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'failed_delivery_reason' => ['required', 'string'],
            'rescheduled_for' => ['nullable', 'date'],
            'offline' => ['nullable', 'array'],
        ];
    }
}
