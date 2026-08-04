<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelShiftLog extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'staff_id',
        'attendant_name',
        'shift_name',
        'opened_at',
        'closed_at',
        'cash_expected',
        'cash_reported',
        'shortage_amount',
        'recovery_amount',
        'notes',
        'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'cash_expected' => 'decimal:2',
        'cash_reported' => 'decimal:2',
        'shortage_amount' => 'decimal:2',
        'recovery_amount' => 'decimal:2',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
