<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelRoomInspectionLog extends Model
{
    protected $fillable = [
        'business_id',
        'room_id',
        'inspected_by',
        'status',
        'notes',
        'inspected_at',
    ];

    protected $casts = [
        'inspected_at' => 'datetime',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(HotelRoom::class, 'room_id');
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}
