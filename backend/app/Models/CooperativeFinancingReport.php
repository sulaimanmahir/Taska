<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeFinancingReport extends Model
{
    protected $fillable = [
        'financing_id',
        'reporting_period_start',
        'reporting_period_end',
        'revenue',
        'direct_cost',
        'net_profit',
        'cooperative_share_amount',
        'member_share_amount',
        'status',
        'report_notes',
        'submitted_at',
    ];

    protected $casts = [
        'reporting_period_start' => 'date',
        'reporting_period_end' => 'date',
        'revenue' => 'decimal:2',
        'direct_cost' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'cooperative_share_amount' => 'decimal:2',
        'member_share_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function financing(): BelongsTo
    {
        return $this->belongsTo(CooperativeFinancing::class, 'financing_id');
    }
}
