<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyRentLedgerEntry extends Model
{
    use BelongsToBusiness;

    public const TYPE_CHARGE = 'charge';
    public const TYPE_PAYMENT = 'payment';

    protected $fillable = [
        'business_id',
        'property_lease_id',
        'customer_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'transaction_date',
        'reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function propertyLease(): BelongsTo
    {
        return $this->belongsTo(PropertyLease::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
