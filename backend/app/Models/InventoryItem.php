<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = [
        'business_id',
        'warehouse_id',
        'product_id',
        'variant_id',
        'quantity',
        'reserved_quantity',
        'reorder_point',
        'reorder_quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'reserved_quantity' => 'decimal:3',
        'reorder_point' => 'decimal:3',
        'reorder_quantity' => 'decimal:3',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function availableQuantity(): float
    {
        return (float) ($this->quantity - $this->reserved_quantity);
    }
}
