<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanFeature extends Model
{
    protected $fillable = [
        'plan_id',
        'feature_key',
        'feature_name',
        'value_type',
        'value',
        'sort_order',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function getIntValue(): ?int
    {
        return $this->value_type === 'integer' ? (int) $this->value : null;
    }

    public function getBoolValue(): bool
    {
        return $this->value_type === 'boolean' && $this->value === 'true';
    }
}