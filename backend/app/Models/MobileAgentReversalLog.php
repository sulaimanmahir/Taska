<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MobileAgentReversalLog extends Model
{
    protected $fillable = [
        'business_id',
        'mobile_agent_transaction_id',
        'reason',
        'status',
        'amount',
        'requested_at',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(MobileAgentTransaction::class, 'mobile_agent_transaction_id');
    }
}
