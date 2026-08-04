<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FarmPlot extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'location',
        'size_hectares',
        'soil_type',
        'status',
    ];

    protected $casts = [
        'size_hectares' => 'decimal:2',
    ];

    public function plantingCycles(): HasMany
    {
        return $this->hasMany(FarmPlantingCycle::class, 'plot_id');
    }
}
