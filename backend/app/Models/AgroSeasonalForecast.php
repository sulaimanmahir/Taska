<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgroSeasonalForecast extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'product_id',
        'season_name',
        'region_name',
        'forecast_quantity',
        'reserved_quantity',
        'confidence_score',
        'forecast_start_date',
        'forecast_end_date',
        'notes',
    ];

    protected $casts = [
        'forecast_quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'confidence_score' => 'decimal:2',
        'forecast_start_date' => 'date',
        'forecast_end_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
