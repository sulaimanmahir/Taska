<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FarmInputLog extends Model
{
    protected $fillable = [
        'business_id',
        'planting_cycle_id',
        'input_type',
        'input_name',
        'quantity',
        'unit',
        'cost',
        'applied_on',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'cost' => 'decimal:2',
        'applied_on' => 'date',
    ];

    public function plantingCycle(): BelongsTo
    {
        return $this->belongsTo(FarmPlantingCycle::class, 'planting_cycle_id');
    }
}
