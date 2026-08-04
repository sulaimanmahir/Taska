<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionProductProfile extends Model
{
    protected $fillable = [
        'business_id',
        'product_id',
        'subcategory',
        'brand',
        'unit_type',
        'wholesale_price',
        'contractor_price',
        'supplier_id',
        'stock_location_type',
        'weight_kg',
        'image_url',
        'scarcity_pricing_allowed',
    ];

    protected $casts = [
        'wholesale_price' => 'decimal:2',
        'contractor_price' => 'decimal:2',
        'weight_kg' => 'decimal:3',
        'scarcity_pricing_allowed' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
