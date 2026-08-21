<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Unlike UpdateApprovalSettingsRequest (business-wide, where
 * require_inventory_adjustment_approval is a required boolean),
 * require_inventory_adjustment_approval here is nullable - null means "no
 * override, inherit the business setting," a distinct state from an
 * explicit false override.
 */
class UpdateBranchApprovalSettingsRequest extends FormRequest
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
            'require_inventory_adjustment_approval' => ['nullable', 'boolean'],
        ];
    }
}
