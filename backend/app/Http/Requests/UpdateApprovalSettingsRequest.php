<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApprovalSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'expense_approval_threshold' => ['nullable', 'numeric', 'min:0'],
            'discount_approval_threshold' => ['nullable', 'numeric', 'min:0'],
            'require_inventory_adjustment_approval' => ['required', 'boolean'],
        ];
    }
}
