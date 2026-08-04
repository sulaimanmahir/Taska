<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionMaterial extends Model
{
    protected $table = 'production_materials';

    protected $fillable = [
        'production_batch_id',
        'raw_material_id',
        'quantity_used',
        'cost',
    ];

    protected $casts = [
        'quantity_used' => 'decimal:2',
        'cost' => 'decimal:2',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
