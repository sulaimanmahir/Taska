<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpiryAlert extends Model
{
    protected $table = 'expiry_alerts';

    protected $fillable = [
        'business_id',
        'product_batch_id',
        'status',
        'days_before_expiry',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }
}
