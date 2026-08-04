<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class BusinessSubscription extends Model
{
    protected $fillable = [
        'business_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'cancelled_at',
        'is_auto_renew',
        'billing_cycle',
        'amount_paid',
        'currency',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'cancelled_at' => 'date',
        'is_auto_renew' => 'boolean',
        'amount_paid' => 'decimal:2',
    ];

    const STATUS_TRIAL = 'trial';
    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_SUSPENDED = 'suspended';

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function usage(): HasMany
    {
        return $this->hasMany(SubscriptionUsage::class, 'subscription_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'subscription_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_TRIAL, self::STATUS_ACTIVE], true);
    }

    public function isExpired(): bool
    {
        return $this->ends_at && Carbon::parse($this->ends_at)->isPast();
    }

    public function daysRemaining(): int
    {
        if (!$this->ends_at) {
            return $this->status === self::STATUS_TRIAL ? 14 : 999;
        }

        return max(0, now()->diffInDays(Carbon::parse($this->ends_at), false));
    }

    public function hasReachedLimit(string $featureKey): bool
    {
        $usage = $this->usage()->where('feature_key', $featureKey)->first();
        if (!$usage) return false;
        $feature = $this->plan()->first()->features()->where('feature_key', $featureKey)->first();
        if (!$feature) return false;
        return $usage->current_usage >= $usage->limit_value;
    }
}
