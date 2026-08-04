<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceBooking extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'scheduled_for' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function offering(): BelongsTo
    {
        return $this->belongsTo(ServiceOffering::class, 'offering_id');
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(ServiceJob::class, 'booking_id');
    }
}
