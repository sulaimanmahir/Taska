<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'student_id' => $this->student_id,
            'academic_term_id' => $this->academic_term_id,
            'school_subject_id' => $this->school_subject_id,
            'score' => $this->score,
            'grade' => $this->grade,
            'teacher_comment' => $this->teacher_comment,
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
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject?->id,
                'name' => $this->subject?->name,
                'department' => $this->subject?->department,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
