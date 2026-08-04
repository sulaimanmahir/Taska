<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CooperativeMember extends Model
{
    protected $fillable = [
        'cooperative_id',
        'business_id',
        'customer_id',
        'user_id',
        'member_number',
        'role',
        'joined_at',
        'status',
        'shares_locked',
        'notes',
    ];

    protected $casts = [
        'joined_at' => 'date',
        'shares_locked' => 'decimal:2',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shareTransactions(): HasMany
    {
        return $this->hasMany(CooperativeShare::class, 'member_id');
    }

    public function financing(): HasMany
    {
        return $this->hasMany(CooperativeFinancing::class, 'member_id');
    }
}
