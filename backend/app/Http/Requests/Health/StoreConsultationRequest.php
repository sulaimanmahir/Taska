<?php

namespace App\Http\Requests\Health;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'appointment_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('clinic_appointments', $businessId),
            ],
            'patient_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('patient_records', $businessId),
            ],
            'doctor_id' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
            'triage_vitals' => ['nullable', 'array'],
            'doctor_notes' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment_plan' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
            'billing_amount' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }

    private function activeBusinessUserRule(int $businessId)
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($subQuery) use ($businessId) {
                $subQuery->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
