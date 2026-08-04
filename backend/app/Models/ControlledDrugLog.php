<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ControlledDrugLog extends Model
{
    protected $fillable = ['business_id', 'product_id', 'product_batch_id', 'customer_id', 'movement_type', 'quantity', 'prescription_reference', 'notes', 'created_by'];

    protected $casts = ['quantity' => 'decimal:2'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
