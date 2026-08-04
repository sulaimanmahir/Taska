<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
        protected $fillable = [
        'business_id',
        'type',
        'severity',
        'title',
        'description',
        'recommendation',
        'data',
        'is_read',
        'is_dismissed',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'is_dismissed' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
