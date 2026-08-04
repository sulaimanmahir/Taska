<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralPayout extends Model
{
    protected $fillable = [
        'agent_id',
        'payout_number',
        'amount',
        'fees',
        'net_amount',
        'currency',
        'status',
        'payment_method',
        'bank_name',
        'account_number',
        'account_name',
        'gateway_reference',
        'failure_reason',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fees' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(ReferralCommission::class, 'agent_id');
    }

    public function markAsProcessing(): void
    {
        $this->status = self::STATUS_PROCESSING;
        $this->save();
    }

    public function markAsCompleted(string $reference = null): void
    {
        $this->status = self::STATUS_COMPLETED;
        $this->processed_at = now();
        if ($reference) {
            $this->gateway_reference = $reference;
        }
        $this->save();
    }

    public function markAsFailed(string $reason): void
    {
        $this->status = self::STATUS_FAILED;
        $this->failure_reason = $reason;
        $this->save();
    }
}