<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticsDriverSettlement extends Model
{
    protected $fillable = [
        'business_id',
        'trip_sheet_id',
        'driver_id',
        'gross_revenue',
        'trip_cost',
        'driver_payout',
        'company_retained',
        'fuel_deduction',
        'maintenance_deduction',
        'status',
        'settled_at',
    ];

    protected $casts = [
        'settled_at' => 'datetime',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(LogisticsTripSheet::class, 'trip_sheet_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
