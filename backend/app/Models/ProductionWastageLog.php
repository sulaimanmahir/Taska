<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionWastageLog extends Model
{
    protected $fillable = [
        'business_id',
        'production_batch_id',
        'raw_material_id',
        'loss_type',
        'quantity',
        'estimated_cost',
        'notes',
        'logged_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'estimated_cost' => 'decimal:2',
        'logged_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}
