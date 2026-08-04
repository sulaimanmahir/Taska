<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralFraudLog extends Model
{
    protected $fillable = [
        'agent_id',
        'type',
        'severity',
        'description',
        'evidence',
        'is_resolved',
        'resolution_notes',
        'resolved_at',
    ];

    protected $casts = [
        'evidence' => 'array',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    const TYPE_SELF_REFERRAL = 'self_referral';
    const TYPE_DUPLICATE_IP = 'duplicate_ip';
    const TYPE_SUSPICIOUS_PATTERN = 'suspicious_pattern';

    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }

    public function resolve(string $notes = ''): void
    {
        $this->is_resolved = true;
        $this->resolution_notes = $notes;
        $this->resolved_at = now();
        $this->save();
    }
}