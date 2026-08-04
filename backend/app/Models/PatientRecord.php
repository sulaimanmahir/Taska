<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatientRecord extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'patient_code',
        'full_name',
        'phone',
        'email',
        'date_of_birth',
        'gender',
        'blood_group',
        'medical_history',
        'hmo_provider',
        'insurance_number',
        'guardian_name',
        'guardian_phone',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function appointments(): HasMany
    {
        return $this->hasMany(ClinicAppointment::class, 'patient_id');
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(ClinicConsultation::class, 'patient_id');
    }

    public function labRequests(): HasMany
    {
        return $this->hasMany(LabRequest::class, 'patient_id');
    }
}
