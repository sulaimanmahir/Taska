<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReferralAgent extends Model
{
    protected $fillable = [
        'business_id',
        'referral_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'status',
        'agent_type',
        'tier',
        'commission_rate',
        'recurring_rate',
        'bank_name',
        'account_number',
        'account_name',
        'bank_code',
        'payment_method',
        'total_earnings',
        'pending_payout',
        'total_paid',
        'notes',
        'onboarded_at',
        'approved_at',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'recurring_rate' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'pending_payout' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'onboarded_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    const TYPE_RESELLER = 'reseller';
    const TYPE_AFFILIATE = 'affiliate';
    const TYPE_INTRODUCER = 'introducer';

    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_TERMINATED = 'terminated';

    const TIER_BRONZE = 'bronze';
    const TIER_SILVER = 'silver';
    const TIER_GOLD = 'gold';
    const TIER_PLATINUM = 'platinum';

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ReferralAgentDocument::class, 'agent_id');
    }

    public function onboardingSteps(): HasMany
    {
        return $this->hasMany(ReferralAgentOnboarding::class, 'agent_id')->orderBy('step');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(ReferralCommission::class, 'agent_id');
    }

    public function tracking(): HasMany
    {
        return $this->hasMany(ReferralTracking::class, 'agent_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(ReferralPayout::class, 'agent_id');
    }

    public function bonuses(): HasMany
    {
        return $this->hasMany(ReferralBonus::class, 'agent_id');
    }

    public function fraudLogs(): HasMany
    {
        return $this->hasMany(ReferralFraudLog::class, 'agent_id');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function canReceiveCommission(): bool
    {
        return $this->status === self::STATUS_ACTIVE && $this->onboarded_at !== null;
    }

    public function getReferralUrl(string $baseUrl): string
    {
        return "{$baseUrl}?ref={$this->referral_code}";
    }
}