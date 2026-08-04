<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockDiseaseLog extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'disease_name',
        'severity',
        'affected_count',
        'recorded_on',
        'status',
    ];

    protected $casts = [
        'affected_count' => 'integer',
        'recorded_on' => 'date',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
