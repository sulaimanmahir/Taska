<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEnrollment extends Model
{
    protected $fillable = [
        'business_id',
        'student_id',
        'academic_session_id',
        'academic_term_id',
        'school_classroom_id',
        'enrollment_status',
        'promotion_decision',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentRecord::class, 'student_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'academic_term_id');
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(SchoolClassroom::class, 'school_classroom_id');
    }
}
