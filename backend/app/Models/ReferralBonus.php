<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralBonus extends Model
{
    protected $fillable = [
        'agent_id',
        'type',
        'title',
        'description',
        'amount',
        'currency',
        'status',
        'conditions',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'conditions' => 'array',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_PAID = 'paid';
    const STATUS_CANCELLED = 'cancelled';

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }
}