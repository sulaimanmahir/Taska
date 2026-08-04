<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionEnergyLog extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'production_batch_id',
        'energy_source',
        'runtime_hours',
        'cost',
        'fuel_litres',
        'outage_minutes',
        'notes',
        'logged_at',
    ];

    protected $casts = [
        'runtime_hours' => 'decimal:2',
        'cost' => 'decimal:2',
        'fuel_litres' => 'decimal:2',
        'logged_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }
}
