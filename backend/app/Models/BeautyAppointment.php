<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeautyAppointment extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'appointment_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(BeautyService::class, 'service_id');
    }

    public function staffProfile(): BelongsTo
    {
        return $this->belongsTo(BeautyStaffProfile::class, 'staff_profile_id');
    }

    public function productUsages(): HasMany
    {
        return $this->hasMany(BeautyProductUsage::class, 'appointment_id');
    }
}
