<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralAgentDocument extends Model
{
    protected $fillable = [
        'agent_id',
        'type',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'is_verified',
        'verified_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }
}