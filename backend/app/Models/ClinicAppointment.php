<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ClinicAppointment extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'patient_id',
        'doctor_id',
        'appointment_code',
        'scheduled_for',
        'status',
        'reason',
        'referral_source',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(PatientRecord::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(ClinicConsultation::class, 'appointment_id');
    }
}
