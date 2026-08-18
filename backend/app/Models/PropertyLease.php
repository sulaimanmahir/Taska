<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PropertyLease extends Model
{
    use BelongsToBusiness;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_ENDED = 'ended';
    public const STATUS_TERMINATED = 'terminated';

    protected $fillable = [
        'business_id',
        'property_unit_id',
        'customer_id',
        'start_date',
        'end_date',
        'rent_amount',
        'service_charge_amount',
        'payment_frequency_days',
        'deposit_amount',
        'balance',
        'next_due_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'rent_amount' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
        'payment_frequency_days' => 'integer',
        'deposit_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'next_due_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function propertyUnit(): BelongsTo
    {
        return $this->belongsTo(PropertyUnit::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(PropertyRentLedgerEntry::class);
    }

    public function totalDueAmount(): float
    {
        return (float) $this->rent_amount + (float) ($this->service_charge_amount ?? 0);
    }
}
