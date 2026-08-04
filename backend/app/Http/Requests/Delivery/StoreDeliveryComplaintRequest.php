<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'source' => 'nullable|string|max:100',
            'category' => 'required|string|max:100',
            'summary' => 'required|string',
            'status' => 'nullable|in:open,investigating,resolved',
        ];
    }
}
