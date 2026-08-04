<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailPettyCashEntry extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'shift_id',
        'recorded_by',
        'entry_type',
        'category',
        'amount',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function shift(): BelongsTo
    {
        return $this->belongsTo(RetailCashierShift::class, 'shift_id');
    }
}
