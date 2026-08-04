<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TailoringJob extends Model
{
    protected $fillable = [
        'business_id',
        'style_order_id',
        'assigned_tailor',
        'stage',
        'priority',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function styleOrder(): BelongsTo
    {
        return $this->belongsTo(TextileStyleOrder::class, 'style_order_id');
    }
}
