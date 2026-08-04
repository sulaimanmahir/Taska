<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentResult extends Model
{
    protected $fillable = ['business_id', 'student_id', 'academic_term_id', 'school_subject_id', 'score', 'grade', 'teacher_comment'];

    protected $casts = ['score' => 'decimal:2'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentRecord::class, 'student_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'academic_term_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(SchoolSubject::class, 'school_subject_id');
    }
}
