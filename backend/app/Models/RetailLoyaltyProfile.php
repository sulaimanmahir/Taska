<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailLoyaltyProfile extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'phone',
        'tier',
        'points_balance',
        'lifetime_spend',
        'last_purchase_at',
    ];

    protected $casts = [
        'points_balance' => 'decimal:2',
        'lifetime_spend' => 'decimal:2',
        'last_purchase_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
