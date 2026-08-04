<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LogisticsTripSheet extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fleet_asset_id',
        'driver_id',
        'trip_code',
        'job_type',
        'customer_name',
        'route_name',
        'origin',
        'destination',
        'trip_date',
        'status',
        'expected_revenue',
        'actual_revenue',
        'distance_km',
        'expected_fuel_cost',
        'actual_fuel_cost',
        'loading_cost',
        'driver_allowance',
        'maintenance_cost',
        'other_cost',
        'profit_estimate',
        'payment_status',
        'notes',
        'departed_at',
        'arrived_at',
    ];

    protected $casts = [
        'trip_date' => 'date',
        'departed_at' => 'datetime',
        'arrived_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(LogisticsFleetAsset::class, 'fleet_asset_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(LogisticsTripStop::class, 'trip_sheet_id')->orderBy('stop_order');
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(LogisticsFuelLog::class, 'trip_sheet_id');
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(LogisticsMaintenanceLog::class, 'trip_sheet_id');
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(LogisticsDriverSettlement::class, 'trip_sheet_id');
    }
}
