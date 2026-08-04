<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'student_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('student_records', $businessId),
            ],
            'academic_term_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_terms', $businessId),
            ],
            'attendance_date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'notes' => ['nullable', 'string'],
        ];
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
