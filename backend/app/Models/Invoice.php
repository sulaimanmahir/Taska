<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invoice extends Model
{
    protected $fillable = [
        'business_id',
        'subscription_id',
        'invoice_number',
        'type',
        'subtotal',
        'tax',
        'total',
        'currency',
        'status',
        'due_date',
        'paid_at',
        'payment_method',
        'gateway_reference',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
        'due_date' => 'date',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    const TYPE_SUBSCRIPTION = 'subscription';
    const TYPE_RENEWAL = 'renewal';
    const TYPE_UPGRADE = 'upgrade';
    const TYPE_ADDON = 'addon';

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(BusinessSubscription::class, 'subscription_id');
    }

    public function paymentAttempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class, 'invoice_id');
    }

    public function lastPaymentAttempt(): HasOne
    {
        return $this->hasOne(PaymentAttempt::class, 'invoice_id')->latestOfMany();
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function markAsPaid(string $method, string $reference): void
    {
        $this->status = self::STATUS_PAID;
        $this->paid_at = now();
        $this->payment_method = $method;
        $this->gateway_reference = $reference;
        $this->save();
    }
}