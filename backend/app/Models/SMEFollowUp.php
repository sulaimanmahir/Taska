<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SMEFollowUp extends Model
{
    protected $table = 'sme_follow_ups';

    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'assigned_to',
        'category',
        'status',
        'title',
        'notes',
        'amount_in_focus',
        'due_on',
        'completed_at',
    ];

    protected $casts = [
        'due_on' => 'date',
        'completed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
