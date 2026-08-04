<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuelTank extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'fuel_type',
        'capacity_litres',
        'current_stock_litres',
        'reorder_level_litres',
        'price_per_litre',
        'last_dip_variance',
        'status',
    ];

    protected $casts = [
        'capacity_litres' => 'decimal:2',
        'current_stock_litres' => 'decimal:2',
        'reorder_level_litres' => 'decimal:2',
        'price_per_litre' => 'decimal:2',
        'last_dip_variance' => 'decimal:2',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function pumps(): HasMany
    {
        return $this->hasMany(FuelPump::class);
    }

    public function dips(): HasMany
    {
        return $this->hasMany(FuelTankDip::class);
    }
}
