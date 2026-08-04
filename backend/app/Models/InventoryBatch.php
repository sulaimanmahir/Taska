<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryBatch extends Model
{
    protected $table = 'inventory_batches';

    protected $fillable = [
        'business_id',
        'warehouse_id',
        'product_id',
        'variant_id',
        'batch_number',
        'expiry_date',
        'quantity',
        'unit_cost',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
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
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
