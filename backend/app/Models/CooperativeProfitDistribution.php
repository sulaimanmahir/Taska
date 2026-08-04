<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeProfitDistribution extends Model
{
    protected $fillable = [
        'profit_cycle_id',
        'member_id',
        'shares_at_record',
        'ownership_percent',
        'amount',
        'status',
        'withdrawn_at',
    ];

    protected $casts = [
        'shares_at_record' => 'decimal:2',
        'ownership_percent' => 'decimal:2',
        'amount' => 'decimal:2',
        'withdrawn_at' => 'datetime',
    ];

    public function profitCycle(): BelongsTo
    {
        return $this->belongsTo(CooperativeProfitCycle::class, 'profit_cycle_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(CooperativeMember::class, 'member_id');
    }
}
