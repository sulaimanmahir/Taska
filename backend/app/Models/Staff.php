<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    protected $fillable = [
        'business_id',
        'user_id',
        'name',
        'email',
        'phone',
        'role',
        'branch_id',
        'employment_type',
        'salary',
        'hire_date',
        'termination_date',
        'status',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'hire_date' => 'date',
        'termination_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
