<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralTier extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'min_referrals',
        'max_referrals',
        'commission_rate',
        'recurring_rate',
        'badge_color',
        'is_active',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'recurring_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function agents(): HasMany
    {
        return $this->hasMany(ReferralAgent::class, 'tier');
    }

    public function getNextTier(): ?self
    {
        $tiers = ['bronze' => 'silver', 'silver' => 'gold', 'gold' => 'platinum'];
        return self::where('slug', $tiers[$this->slug] ?? null)->first();
    }

    public function shouldUpgrade(int $referralCount): bool
    {
        if ($this->max_referrals === null) return false;
        return $referralCount >= $this->min_referrals && $referralCount < $this->max_referrals;
    }
}