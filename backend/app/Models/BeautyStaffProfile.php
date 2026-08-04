<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeautyStaffProfile extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function appointments(): HasMany
    {
        return $this->hasMany(BeautyAppointment::class, 'staff_profile_id');
    }
}
