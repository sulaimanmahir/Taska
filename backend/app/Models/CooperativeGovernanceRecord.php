<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeGovernanceRecord extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'record_type',
        'title',
        'record_date',
        'status',
        'summary',
        'decisions_json',
        'attachment_url',
    ];

    protected $casts = [
        'record_date' => 'date',
        'decisions_json' => 'array',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }
}
