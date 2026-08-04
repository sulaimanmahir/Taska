<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockMedicationRecord extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'medication_name',
        'dosage',
        'treated_count',
        'cost',
        'administered_on',
    ];

    protected $casts = [
        'treated_count' => 'integer',
        'cost' => 'float',
        'administered_on' => 'date',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
