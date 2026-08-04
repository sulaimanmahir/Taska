<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeWallet extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'wallet_type',
        'balance',
        'locked_balance',
        'currency',
        'notes',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'locked_balance' => 'decimal:2',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }
}
