<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LogisticsFleetAsset extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'assigned_driver_id',
        'asset_type',
        'name',
        'plate_number',
        'ownership_model',
        'capacity_unit',
        'capacity_value',
        'purchase_value',
        'target_km_per_litre',
        'status',
        'fuel_responsibility',
        'maintenance_responsibility',
        'notes',
    ];

    public function trips(): HasMany
    {
        return $this->hasMany(LogisticsTripSheet::class, 'fleet_asset_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_driver_id');
    }
}
