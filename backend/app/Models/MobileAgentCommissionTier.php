<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MobileAgentCommissionTier extends Model
{
    protected $fillable = [
        'business_id',
        'name',
        'service_type',
        'minimum_volume',
        'maximum_volume',
        'commission_rate',
        'flat_bonus',
        'is_active',
    ];

    protected $casts = [
        'minimum_volume' => 'decimal:2',
        'maximum_volume' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'flat_bonus' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(MobileAgentTransaction::class, 'commission_tier_id');
    }
}
