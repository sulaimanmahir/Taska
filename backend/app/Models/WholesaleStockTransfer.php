<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleStockTransfer extends Model
{
    protected $fillable = [
        'business_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'product_id',
        'variant_id',
        'quantity',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
