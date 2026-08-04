<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockBreedingRecord extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'cycle_name',
        'paired_count',
        'successful_births',
        'expected_delivery_date',
        'actual_delivery_date',
        'status',
    ];

    protected $casts = [
        'paired_count' => 'integer',
        'successful_births' => 'integer',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
