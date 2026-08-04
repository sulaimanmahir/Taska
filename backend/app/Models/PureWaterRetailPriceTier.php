<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PureWaterRetailPriceTier extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'product_id',
        'pricing_scope',
        'package_type',
        'minimum_quantity',
        'unit_price',
        'crate_deposit',
        'notes',
    ];

    protected $casts = [
        'minimum_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'crate_deposit' => 'decimal:2',
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
