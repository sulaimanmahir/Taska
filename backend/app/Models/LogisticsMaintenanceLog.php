<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticsMaintenanceLog extends Model
{
    protected $fillable = [
        'business_id',
        'fleet_asset_id',
        'trip_sheet_id',
        'logged_on',
        'category',
        'status',
        'cost',
        'summary',
        'notes',
    ];

    protected $casts = [
        'logged_on' => 'date',
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
