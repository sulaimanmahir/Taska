<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelVarianceAlert extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fuel_tank_id',
        'fuel_pump_id',
        'fuel_shift_log_id',
        'alert_type',
        'severity',
        'metric_value',
        'threshold_value',
        'details',
        'detected_at',
        'is_resolved',
    ];

    protected $casts = [
        'metric_value' => 'decimal:2',
        'threshold_value' => 'decimal:2',
        'detected_at' => 'datetime',
        'is_resolved' => 'boolean',
    ];

    public function tank(): BelongsTo
    {
        return $this->belongsTo(FuelTank::class, 'fuel_tank_id');
    }

    public function pump(): BelongsTo
    {
        return $this->belongsTo(FuelPump::class, 'fuel_pump_id');
    }
}
