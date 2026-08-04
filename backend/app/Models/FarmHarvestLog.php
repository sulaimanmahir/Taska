<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FarmHarvestLog extends Model
{
    protected $fillable = [
        'business_id',
        'planting_cycle_id',
        'quantity_harvested',
        'unit',
        'estimated_revenue',
        'loss_quantity',
        'harvested_on',
        'notes',
    ];

    protected $casts = [
        'quantity_harvested' => 'decimal:3',
        'estimated_revenue' => 'decimal:2',
        'loss_quantity' => 'decimal:3',
        'harvested_on' => 'date',
    ];

    public function plantingCycle(): BelongsTo
    {
        return $this->belongsTo(FarmPlantingCycle::class, 'planting_cycle_id');
    }
}
