<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockMilkLog extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'litres',
        'recorded_on',
    ];

    protected $casts = [
        'litres' => 'float',
        'recorded_on' => 'date',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
