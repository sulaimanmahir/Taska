<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOutput extends Model
{
    protected $table = 'production_outputs';

    protected $fillable = [
        'production_batch_id',
        'product_id',
        'quantity_produced',
        'damaged_quantity',
        'selling_price',
    ];

    protected $casts = [
        'quantity_produced' => 'decimal:2',
        'damaged_quantity' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
