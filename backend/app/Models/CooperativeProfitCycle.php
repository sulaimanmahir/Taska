<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CooperativeProfitCycle extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'label',
        'cycle_start',
        'cycle_end',
        'total_profit',
        'distributable_profit',
        'reserve_allocation',
        'charity_allocation',
        'status',
        'distributed_at',
        'distribution_snapshot',
        'notes',
    ];

    protected $casts = [
        'cycle_start' => 'date',
        'cycle_end' => 'date',
        'total_profit' => 'decimal:2',
        'distributable_profit' => 'decimal:2',
        'reserve_allocation' => 'decimal:2',
        'charity_allocation' => 'decimal:2',
        'distributed_at' => 'datetime',
        'distribution_snapshot' => 'array',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function distributions(): HasMany
    {
        return $this->hasMany(CooperativeProfitDistribution::class, 'profit_cycle_id');
    }
}
