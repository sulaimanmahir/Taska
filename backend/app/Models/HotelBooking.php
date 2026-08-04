<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelBooking extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'room_id',
        'reservation_code',
        'guest_name',
        'guest_phone',
        'guest_email',
        'status',
        'check_in_date',
        'check_out_date',
        'actual_check_in_at',
        'actual_check_out_at',
        'adults',
        'extra_guests',
        'is_repeat_guest',
        'payment_method',
        'room_rate',
        'extra_guest_charge_total',
        'late_checkout_charge_total',
        'early_checkin_charge_total',
        'total_amount',
        'amount_paid',
        'notes',
    ];

    protected $casts = [
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'actual_check_in_at' => 'datetime',
        'actual_check_out_at' => 'datetime',
        'is_repeat_guest' => 'boolean',
        'room_rate' => 'decimal:2',
        'extra_guest_charge_total' => 'decimal:2',
        'late_checkout_charge_total' => 'decimal:2',
        'early_checkin_charge_total' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(HotelRoom::class, 'room_id');
    }
}
