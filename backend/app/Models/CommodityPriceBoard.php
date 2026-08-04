<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommodityPriceBoard extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'product_id',
        'commodity_name',
        'market_name',
        'buying_price_per_kg',
        'selling_price_per_kg',
        'effective_date',
        'reason',
    ];

    protected $casts = [
        'effective_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
