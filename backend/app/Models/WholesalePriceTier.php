<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesalePriceTier extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'product_id',
        'tier_name',
        'minimum_quantity',
        'unit_price',
        'discount_percent',
    ];

    protected $casts = [
        'minimum_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
