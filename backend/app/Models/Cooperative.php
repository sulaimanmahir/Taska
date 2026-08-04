<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Cooperative extends Model
{
    protected $fillable = [
        'business_id',
        'subscription_plan_id',
        'name',
        'slug',
        'description',
        'share_price',
        'minimum_member_shares',
        'contribution_rule',
        'profit_cycle',
        'status',
        'sharia_notes',
    ];

    protected $casts = [
        'share_price' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function loanSettings(): HasOne
    {
        return $this->hasOne(CooperativeLoanSetting::class);
    }

    public function brandingSettings(): HasOne
    {
        return $this->hasOne(CooperativeBrandingSetting::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(CooperativeMember::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(CooperativeShare::class);
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(CooperativeWallet::class);
    }

    public function financing(): HasMany
    {
        return $this->hasMany(CooperativeFinancing::class);
    }

    public function investments(): HasMany
    {
        return $this->hasMany(CooperativeInvestment::class);
    }

    public function profitCycles(): HasMany
    {
        return $this->hasMany(CooperativeProfitCycle::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(CooperativeWithdrawal::class);
    }
}
