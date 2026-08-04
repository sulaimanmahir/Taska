<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'student_id' => $this->student_id,
            'academic_term_id' => $this->academic_term_id,
            'attendance_date' => $this->attendance_date?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student?->id,
                'admission_number' => $this->student?->admission_number,
                'full_name' => $this->student?->full_name,
                'status' => $this->student?->status,
            ]),
            'term' => $this->whenLoaded('term', fn () => [
                'id' => $this->term?->id,
                'name' => $this->term?->name,
                'starts_on' => $this->term?->starts_on?->toDateString(),
                'ends_on' => $this->term?->ends_on?->toDateString(),
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
