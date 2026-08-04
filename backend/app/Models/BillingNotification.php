<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingNotification extends Model
{
    protected $fillable = [
        'business_id',
        'type',
        'channel',
        'subject',
        'message',
        'data',
        'is_sent',
        'sent_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_sent' => 'boolean',
        'sent_at' => 'datetime',
    ];

    const TYPE_RENEWAL_REMINDER = 'renewal_reminder';
    const TYPE_PAYMENT_SUCCESS = 'payment_success';
    const TYPE_PAYMENT_FAILED = 'payment_failed';
    const TYPE_EXPIRY = 'expiry';
    const TYPE_DOWNGRADE_WARNING = 'downgrade_warning';

    const CHANNEL_IN_APP = 'in_app';
    const CHANNEL_EMAIL = 'email';
    const CHANNEL_SMS = 'sms';
    const CHANNEL_WHATSAPP = 'whatsapp';

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function markAsSent(): void
    {
        $this->is_sent = true;
        $this->sent_at = now();
        $this->save();
    }
}