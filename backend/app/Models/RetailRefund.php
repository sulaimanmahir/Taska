<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailRefund extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'order_id',
        'customer_id',
        'processed_by',
        'refund_number',
        'status',
        'refund_amount',
        'payment_method',
        'reason',
        'notes',
        'refunded_at',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
        'refunded_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
