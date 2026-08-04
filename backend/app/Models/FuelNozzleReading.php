<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelNozzleReading extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'fuel_pump_id',
        'attendant_name',
        'shift_name',
        'reading_date',
        'opening_reading',
        'closing_reading',
        'litres_sold',
        'unit_price',
        'expected_sales_amount',
        'recorded_sales_amount',
        'cash_reported',
        'variance_amount',
        'status',
    ];

    protected $casts = [
        'reading_date' => 'date',
        'opening_reading' => 'decimal:2',
        'closing_reading' => 'decimal:2',
        'litres_sold' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'expected_sales_amount' => 'decimal:2',
        'recorded_sales_amount' => 'decimal:2',
        'cash_reported' => 'decimal:2',
        'variance_amount' => 'decimal:2',
    ];

    public function pump(): BelongsTo
    {
        return $this->belongsTo(FuelPump::class, 'fuel_pump_id');
    }
}
