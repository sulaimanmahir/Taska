<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'display_order',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function features(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class, 'plan_id')->orderBy('sort_order');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(BusinessSubscription::class, 'plan_id');
    }

    public function getFeature(string $key): ?SubscriptionPlanFeature
    {
        return $this->features()->where('feature_key', $key)->first();
    }

    public function hasFeature(string $key): bool
    {
        return $this->features()->where('feature_key', $key)->exists();
    }
}
