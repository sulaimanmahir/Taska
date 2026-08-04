<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MobileAgentFraudAlert extends Model
{
    protected $fillable = [
        'business_id',
        'mobile_agent_transaction_id',
        'staff_id',
        'agent_name',
        'alert_type',
        'severity',
        'is_resolved',
        'details',
        'flagged_at',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
        'flagged_at' => 'datetime',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(MobileAgentTransaction::class, 'mobile_agent_transaction_id');
    }
}
