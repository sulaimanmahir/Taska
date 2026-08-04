<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgroRegionalSalesTrend extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'region_name',
        'season_name',
        'input_category',
        'sales_amount',
        'quantity_sold',
        'trend_date',
    ];

    protected $casts = [
        'sales_amount' => 'decimal:2',
        'quantity_sold' => 'decimal:2',
        'trend_date' => 'date',
    ];
}
