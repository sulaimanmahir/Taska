<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralTracking extends Model
{
    protected $fillable = [
        'agent_id',
        'referred_business_id',
        'source_url',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'ip_address',
        'user_agent',
        'is_converted',
        'converted_at',
    ];

    protected $casts = [
        'is_converted' => 'boolean',
        'converted_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }

    public function referredBusiness(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'referred_business_id');
    }

    public function markAsConverted(): void
    {
        $this->is_converted = true;
        $this->converted_at = now();
        $this->save();
    }
}