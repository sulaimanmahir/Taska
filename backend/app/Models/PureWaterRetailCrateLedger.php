<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PureWaterRetailCrateLedger extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'product_id',
        'movement_type',
        'crate_count',
        'deposit_amount',
        'balance_after',
        'recorded_by',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'crate_count' => 'decimal:3',
        'deposit_amount' => 'decimal:2',
        'balance_after' => 'decimal:3',
        'recorded_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
