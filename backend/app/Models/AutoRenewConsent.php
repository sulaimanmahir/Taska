<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutoRenewConsent extends Model
{
    protected $fillable = [
        'business_id',
        'payment_method_id',
        'consent_given',
        'consent_text',
        'consented_at',
        'revoked_at',
        'next_charge_date',
        'next_charge_amount',
        'billing_cycle',
    ];

    protected $casts = [
        'consent_given' => 'boolean',
        'consented_at' => 'datetime',
        'revoked_at' => 'datetime',
        'next_charge_date' => 'date',
        'next_charge_amount' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function revoke(): void
    {
        $this->consent_given = false;
        $this->revoked_at = now();
        $this->save();
    }

    public function isActive(): bool
    {
        return $this->consent_given && !$this->revoked_at;
    }
}