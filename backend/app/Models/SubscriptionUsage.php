<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionUsage extends Model
{
    protected $fillable = [
        'subscription_id',
        'feature_key',
        'current_usage',
        'limit_value',
        'reset_at',
    ];

    protected $casts = [
        'current_usage' => 'integer',
        'limit_value' => 'integer',
        'reset_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(BusinessSubscription::class, 'subscription_id');
    }

    public function incrementUsage(int $amount = 1): void
    {
        $this->current_usage += $amount;
        $this->save();
    }

    public function decrementUsage(int $amount = 1): void
    {
        $this->current_usage = max(0, $this->current_usage - $amount);
        $this->save();
    }

    public function remaining(): ?int
    {
        if ($this->limit_value === null) {
            return null;
        }

        return max(0, $this->limit_value - $this->current_usage);
    }

    public function isAtLimit(): bool
    {
        if ($this->limit_value === null) {
            return false;
        }

        return $this->current_usage >= $this->limit_value;
    }
}
