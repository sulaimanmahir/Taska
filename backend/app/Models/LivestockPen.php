<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LivestockPen extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'section',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(LivestockAnimalGroup::class, 'pen_id');
    }
}
