<?php

namespace App\Http\Requests\Health;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'patient_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('patient_records', $businessId),
            ],
            'consultation_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('clinic_consultations', $businessId),
            ],
            'test_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('lab_test_catalog', $businessId),
            ],
            'requested_by' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
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
