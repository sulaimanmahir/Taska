<?php

namespace App\Http\Requests\Cooperative;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCooperativeFinancingStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:submitted,pending_guarantor_approval,pending_admin_approval,approved,disbursed,active_repayment,repaid,closed,rejected'],
            'amount_disbursed' => ['nullable', 'numeric', 'min:0'],
            'admin_override_reason' => ['nullable', 'string'],
        ];
    }
}
