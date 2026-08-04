<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentEnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'student_id' => $this->student_id,
            'academic_session_id' => $this->academic_session_id,
            'academic_term_id' => $this->academic_term_id,
            'school_classroom_id' => $this->school_classroom_id,
            'enrollment_status' => $this->enrollment_status,
            'promotion_decision' => $this->promotion_decision,
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student?->id,
                'admission_number' => $this->student?->admission_number,
                'full_name' => $this->student?->full_name,
                'status' => $this->student?->status,
                'is_alumni' => $this->student?->is_alumni,
            ]),
            'session' => $this->whenLoaded('session', fn () => [
                'id' => $this->session?->id,
                'name' => $this->session?->name,
            ]),
            'term' => $this->whenLoaded('term', fn () => [
                'id' => $this->term?->id,
                'name' => $this->term?->name,
            ]),
            'classroom' => $this->whenLoaded('classroom', fn () => [
                'id' => $this->classroom?->id,
                'name' => $this->classroom?->name,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
