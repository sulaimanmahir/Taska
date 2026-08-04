<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCommission extends Model
{
    protected $fillable = [
        'agent_id',
        'referred_business_id',
        'type',
        'status',
        'amount',
        'rate_applied',
        'currency',
        'invoice_id',
        'description',
        'approved_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'rate_applied' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    const TYPE_FIRST_PURCHASE = 'first_purchase';
    const TYPE_RECURRING = 'recurring';
    const TYPE_BONUS = 'bonus';

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_PAID = 'paid';
    const STATUS_CANCELLED = 'cancelled';

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }

    public function referredBusiness(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'referred_business_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function approve(): void
    {
        $this->status = self::STATUS_APPROVED;
        $this->approved_at = now();
        $this->save();
    }

    public function markAsPaid(): void
    {
        $this->status = self::STATUS_PAID;
        $this->paid_at = now();
        $this->save();

        $this->agent->pending_payout -= $this->amount;
        $this->agent->total_paid += $this->amount;
        $this->agent->save();
    }
}