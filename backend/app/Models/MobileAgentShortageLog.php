<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MobileAgentShortageLog extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'staff_id',
        'agent_name',
        'shortage_amount',
        'recovered_amount',
        'status',
        'reason',
        'logged_at',
    ];

    protected $casts = [
        'shortage_amount' => 'decimal:2',
        'recovered_amount' => 'decimal:2',
        'logged_at' => 'datetime',
    ];
}
