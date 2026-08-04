<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAttendance extends Model
{
    protected $fillable = ['business_id', 'student_id', 'academic_term_id', 'attendance_date', 'status', 'notes'];

    protected $casts = ['attendance_date' => 'date'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentRecord::class, 'student_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'academic_term_id');
    }
}
