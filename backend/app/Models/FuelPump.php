<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuelPump extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fuel_tank_id',
        'name',
        'code',
        'attendant_name',
        'nozzle_count',
        'meter_reading_start',
        'meter_reading_current',
        'status',
    ];

    protected $casts = [
        'nozzle_count' => 'integer',
        'meter_reading_start' => 'decimal:2',
        'meter_reading_current' => 'decimal:2',
    ];

    public function tank(): BelongsTo
    {
        return $this->belongsTo(FuelTank::class, 'fuel_tank_id');
    }

    public function readings(): HasMany
    {
        return $this->hasMany(FuelNozzleReading::class);
    }
}
