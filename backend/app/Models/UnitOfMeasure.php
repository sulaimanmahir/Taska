<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitOfMeasure extends Model
{
    protected $table = 'units_of_measure';

    protected $fillable = [
        'business_id',
        'name',
        'abbreviation',
        'conversion_factor',
        'base_unit_id',
        'is_base',
    ];

    protected $casts = [
        'is_base' => 'boolean',
        'conversion_factor' => 'decimal:4',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class, 'base_unit_id');
    }
}
