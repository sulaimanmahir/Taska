<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceStaffProfile extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function jobs(): HasMany
    {
        return $this->hasMany(ServiceJob::class, 'staff_profile_id');
    }
}
