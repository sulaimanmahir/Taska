<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyDispense extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'product_id',
        'product_batch_id',
        'substituted_from_product_id',
        'quantity',
        'unit_price',
        'total_amount',
        'prescription_reference',
        'refill_due',
        'dispensed_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'refill_due' => 'boolean',
        'dispensed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }

    public function substitutedFrom(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'substituted_from_product_id');
    }
}
