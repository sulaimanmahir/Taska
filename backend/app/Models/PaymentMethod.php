<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $fillable = [
        'business_id',
        'type',
        'provider',
        'last_four',
        'brand',
        'expiry_month',
        'expiry_year',
        'gateway_token',
        'is_default',
        'is_verified',
        'bank_name',
        'account_number',
        'account_name',
        'bank_code',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
    ];

    const TYPE_CARD = 'card';
    const TYPE_BANK = 'bank';
    const TYPE_ACCOUNT = 'account';

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function paymentAttempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class, 'payment_method_id');
    }

    public function markAsDefault(): void
    {
        static::where('business_id', $this->business_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        $this->is_default = true;
        $this->save();
    }

    public function isExpired(): bool
    {
        if ($this->type !== self::TYPE_CARD) return false;
        if (!$this->expiry_month || !$this->expiry_year) return false;
        $expiry = Carbon\Carbon::createFromDate($this->expiry_year, $this->expiry_month, 1)->endOfMonth();
        return $expiry->isPast();
    }

    public function getMaskedNumber(): string
    {
        if ($this->type === self::TYPE_CARD) {
            return "**** **** **** {$this->last_four}";
        }
        return "****{$this->account_number}";
    }
}