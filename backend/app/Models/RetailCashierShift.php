<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailCashierShift extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'opened_by',
        'closed_by',
        'shift_code',
        'status',
        'opening_float',
        'cash_sales_total',
        'petty_cash_total',
        'refund_total',
        'expected_cash',
        'actual_cash',
        'variance_amount',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opening_float' => 'decimal:2',
        'cash_sales_total' => 'decimal:2',
        'petty_cash_total' => 'decimal:2',
        'refund_total' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'actual_cash' => 'decimal:2',
        'variance_amount' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
