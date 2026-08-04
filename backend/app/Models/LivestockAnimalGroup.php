<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LivestockAnimalGroup extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'pen_id',
        'name',
        'species',
        'breed',
        'animal_count',
        'average_weight_kg',
        'status',
        'acquired_on',
    ];

    protected $casts = [
        'animal_count' => 'integer',
        'average_weight_kg' => 'float',
        'acquired_on' => 'date',
    ];

    public function pen(): BelongsTo
    {
        return $this->belongsTo(LivestockPen::class, 'pen_id');
    }

    public function weightLogs(): HasMany
    {
        return $this->hasMany(LivestockWeightLog::class, 'animal_group_id');
    }

    public function milkLogs(): HasMany
    {
        return $this->hasMany(LivestockMilkLog::class, 'animal_group_id');
    }

    public function diseaseLogs(): HasMany
    {
        return $this->hasMany(LivestockDiseaseLog::class, 'animal_group_id');
    }

    public function medicationRecords(): HasMany
    {
        return $this->hasMany(LivestockMedicationRecord::class, 'animal_group_id');
    }

    public function breedingRecords(): HasMany
    {
        return $this->hasMany(LivestockBreedingRecord::class, 'animal_group_id');
    }
}
