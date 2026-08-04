<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TextileColorVariant extends Model
{
    protected $fillable = [
        'business_id',
        'product_id',
        'color_name',
        'shade_code',
        'unit_type',
        'available_quantity',
        'consignment_quantity',
        'wholesale_price',
        'retail_price',
        'is_active',
    ];

    protected $casts = [
        'available_quantity' => 'decimal:3',
        'consignment_quantity' => 'decimal:3',
        'wholesale_price' => 'decimal:2',
        'retail_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
