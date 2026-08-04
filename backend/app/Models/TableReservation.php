<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableReservation extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'table_id',
        'guest_name',
        'guest_phone',
        'reservation_for',
        'party_size',
        'status',
        'occasion',
        'notes',
    ];

    protected $casts = [
        'reservation_for' => 'datetime',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }
}
