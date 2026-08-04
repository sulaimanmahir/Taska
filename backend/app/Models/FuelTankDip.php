<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelTankDip extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fuel_tank_id',
        'dipped_at',
        'opening_stock_litres',
        'deliveries_received_litres',
        'closing_stock_litres',
        'expected_stock_litres',
        'variance_litres',
        'variance_value',
        'notes',
    ];

    protected $casts = [
        'dipped_at' => 'datetime',
        'opening_stock_litres' => 'decimal:2',
        'deliveries_received_litres' => 'decimal:2',
        'closing_stock_litres' => 'decimal:2',
        'expected_stock_litres' => 'decimal:2',
        'variance_litres' => 'decimal:2',
        'variance_value' => 'decimal:2',
    ];

    public function tank(): BelongsTo
    {
        return $this->belongsTo(FuelTank::class, 'fuel_tank_id');
    }
}
