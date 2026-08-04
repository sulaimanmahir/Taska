<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'zone',
        'seats',
        'status',
        'notes',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(RestaurantTicket::class, 'table_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(TableReservation::class, 'table_id');
    }
}
