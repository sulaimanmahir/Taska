<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MobileAgentTransaction extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'staff_id',
        'commission_tier_id',
        'agent_name',
        'service_type',
        'transaction_reference',
        'transaction_amount',
        'commission_amount',
        'cash_delta',
        'float_delta',
        'closing_float_balance',
        'status',
        'is_reversal_requested',
        'notes',
        'processed_at',
    ];

    protected $casts = [
        'transaction_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'cash_delta' => 'decimal:2',
        'float_delta' => 'decimal:2',
        'closing_float_balance' => 'decimal:2',
        'is_reversal_requested' => 'boolean',
        'processed_at' => 'datetime',
    ];

    public function commissionTier(): BelongsTo
    {
        return $this->belongsTo(MobileAgentCommissionTier::class, 'commission_tier_id');
    }

    public function reversals(): HasMany
    {
        return $this->hasMany(MobileAgentReversalLog::class);
    }
}
