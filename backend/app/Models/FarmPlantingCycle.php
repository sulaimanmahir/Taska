<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FarmPlantingCycle extends Model
{
    protected $fillable = [
        'business_id',
        'plot_id',
        'crop_name',
        'season_name',
        'planting_date',
        'expected_harvest_date',
        'actual_harvest_date',
        'planted_area_hectares',
        'status',
        'notes',
    ];

    protected $casts = [
        'planting_date' => 'date',
        'expected_harvest_date' => 'date',
        'actual_harvest_date' => 'date',
        'planted_area_hectares' => 'decimal:2',
    ];

    public function plot(): BelongsTo
    {
        return $this->belongsTo(FarmPlot::class, 'plot_id');
    }

    public function inputLogs(): HasMany
    {
        return $this->hasMany(FarmInputLog::class, 'planting_cycle_id');
    }

    public function harvestLogs(): HasMany
    {
        return $this->hasMany(FarmHarvestLog::class, 'planting_cycle_id');
    }
}
