<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticsTripStop extends Model
{
    protected $fillable = [
        'trip_sheet_id',
        'customer_id',
        'stop_order',
        'stop_name',
        'location',
        'status',
        'expected_revenue',
        'actual_revenue',
        'notes',
        'arrived_at',
        'completed_at',
    ];

    protected $casts = [
        'arrived_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(LogisticsTripSheet::class, 'trip_sheet_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
