<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeautyService extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function appointments(): HasMany
    {
        return $this->hasMany(BeautyAppointment::class, 'service_id');
    }
}
