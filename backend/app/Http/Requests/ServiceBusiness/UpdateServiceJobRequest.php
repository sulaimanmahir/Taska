<?php

namespace App\Http\Requests\ServiceBusiness;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'staff_profile_id' => [
                'nullable',
                Rule::exists('service_staff_profiles', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'status' => ['nullable', 'in:open,in_progress,completed,cancelled'],
            'quoted_amount' => ['nullable', 'numeric', 'min:0'],
            'invoice_amount' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
