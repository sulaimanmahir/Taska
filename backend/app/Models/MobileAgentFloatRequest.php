<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MobileAgentFloatRequest extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'staff_id',
        'agent_name',
        'requested_amount',
        'approved_amount',
        'status',
        'reason',
        'requested_at',
        'approved_at',
    ];

    protected $casts = [
        'requested_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];
}
