<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockWeightLog extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'weight_kg',
        'sample_size',
        'weighed_at',
    ];

    protected $casts = [
        'weight_kg' => 'float',
        'sample_size' => 'integer',
        'weighed_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
