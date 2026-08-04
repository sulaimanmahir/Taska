<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticsFuelLog extends Model
{
    protected $fillable = [
        'business_id',
        'trip_sheet_id',
        'fleet_asset_id',
        'recorded_by',
        'log_date',
        'litres',
        'unit_cost',
        'amount',
        'odometer_km',
        'source',
        'notes',
    ];

    protected $casts = [
        'log_date' => 'date',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(LogisticsTripSheet::class, 'trip_sheet_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(LogisticsFleetAsset::class, 'fleet_asset_id');
    }
}
