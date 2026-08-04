<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleRouteStop extends Model
{
    protected $fillable = [
        'route_run_id',
        'customer_id',
        'order_id',
        'stop_name',
        'status',
        'expected_amount',
        'collected_amount',
        'notes',
    ];

    protected $casts = [
        'expected_amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
