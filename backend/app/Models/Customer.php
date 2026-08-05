<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'customer_group_id',
        'credit_limit',
        'balance',
        'customer_type',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(CustomerGroup::class, 'customer_group_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function canOrderOnCredit(): bool
    {
        return $this->balance < $this->credit_limit;
    }
}
