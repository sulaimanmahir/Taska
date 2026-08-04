<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeShare extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'member_id',
        'transaction_type',
        'units',
        'amount_paid',
        'price_per_share',
        'issued_at',
        'notes',
        'locked_reason',
    ];

    protected $casts = [
        'units' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'price_per_share' => 'decimal:2',
        'issued_at' => 'date',
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
