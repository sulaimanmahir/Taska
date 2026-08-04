<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuelPriceChangeLog extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fuel_type',
        'old_price',
        'new_price',
        'effective_at',
        'changed_by_name',
        'reason',
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'effective_at' => 'datetime',
    ];
}
