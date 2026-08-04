<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClinicConsultation extends Model
{
    protected $fillable = [
        'business_id',
        'appointment_id',
        'patient_id',
        'doctor_id',
        'triage_vitals',
        'doctor_notes',
        'diagnosis',
        'treatment_plan',
        'follow_up_date',
        'billing_amount',
        'amount_paid',
        'receipt_number',
    ];

    protected $casts = [
        'triage_vitals' => 'array',
        'follow_up_date' => 'datetime',
        'billing_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(PatientRecord::class, 'patient_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(ClinicAppointment::class, 'appointment_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function labRequests(): HasMany
    {
        return $this->hasMany(LabRequest::class, 'consultation_id');
    }
}
