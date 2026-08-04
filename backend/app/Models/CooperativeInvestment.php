<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeInvestment extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'product_id',
        'name',
        'category',
        'status',
        'amount',
        'expected_return_rate',
        'current_value',
        'start_date',
        'end_date',
        'linked_inventory',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expected_return_rate' => 'decimal:2',
        'current_value' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'linked_inventory' => 'boolean',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
