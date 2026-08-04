<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeWithdrawal extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'member_id',
        'withdrawal_type',
        'status',
        'amount',
        'reason',
        'requested_at',
        'approved_at',
        'processed_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(CooperativeMember::class, 'member_id');
    }
}
