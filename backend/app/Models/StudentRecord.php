<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentRecord extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'admission_number',
        'full_name',
        'date_of_birth',
        'gender',
        'phone',
        'email',
        'admitted_on',
        'status',
        'transfer_status',
        'is_alumni',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'admitted_on' => 'date',
        'is_alumni' => 'boolean',
    ];

    public function guardians(): HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'student_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class, 'student_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class, 'student_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(StudentResult::class, 'student_id');
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(SchoolFeePayment::class, 'student_id');
    }
}
