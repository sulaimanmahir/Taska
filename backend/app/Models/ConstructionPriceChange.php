<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionPriceChange extends Model
{
    protected $fillable = [
        'business_id',
        'product_id',
        'price_type',
        'previous_price',
        'new_price',
        'reason',
        'effective_date',
        'created_by',
    ];

    protected $casts = [
        'previous_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
