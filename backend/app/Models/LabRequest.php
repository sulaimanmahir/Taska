<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabRequest extends Model
{
    protected $fillable = [
        'business_id',
        'patient_id',
        'consultation_id',
        'test_id',
        'requested_by',
        'technician_id',
        'sample_barcode',
        'status',
        'result_value',
        'is_abnormal',
        'rejection_reason',
        'sample_collected_at',
        'approved_at',
    ];

    protected $casts = [
        'is_abnormal' => 'boolean',
        'sample_collected_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(PatientRecord::class, 'patient_id');
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(ClinicConsultation::class, 'consultation_id');
    }

    public function test(): BelongsTo
    {
        return $this->belongsTo(LabTestCatalog::class, 'test_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
