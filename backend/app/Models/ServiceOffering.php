<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceOffering extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function bookings(): HasMany
    {
        return $this->hasMany(ServiceBooking::class, 'offering_id');
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(ServiceJob::class, 'offering_id');
    }
}
