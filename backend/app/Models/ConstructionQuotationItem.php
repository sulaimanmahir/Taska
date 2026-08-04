<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionQuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'product_id',
        'item_name',
        'unit_type',
        'quantity',
        'converted_quantity',
        'unit_price',
        'discount_amount',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'converted_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(ConstructionQuotation::class, 'quotation_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
