<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoom extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'room_number',
        'category',
        'floor',
        'status',
        'cleaning_status',
        'base_rate',
        'extra_guest_charge',
        'late_checkout_charge',
        'early_checkin_charge',
        'blocked_reason',
        'is_active',
    ];

    protected $casts = [
        'base_rate' => 'decimal:2',
        'extra_guest_charge' => 'decimal:2',
        'late_checkout_charge' => 'decimal:2',
        'early_checkin_charge' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(HotelBooking::class, 'room_id');
    }

    public function housekeepingLogs(): HasMany
    {
        return $this->hasMany(HotelHousekeepingLog::class, 'room_id');
    }

    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(HotelMaintenanceRequest::class, 'room_id');
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(HotelRoomInspectionLog::class, 'room_id');
    }
}
