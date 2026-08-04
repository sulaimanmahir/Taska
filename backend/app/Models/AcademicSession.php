<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSession extends Model
{
    protected $fillable = ['business_id', 'name', 'starts_on', 'ends_on', 'is_active'];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'is_active' => 'boolean',
    ];

    public function terms(): HasMany
    {
        return $this->hasMany(AcademicTerm::class);
    }
}
