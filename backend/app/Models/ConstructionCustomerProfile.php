<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionCustomerProfile extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'customer_role',
        'site_location',
        'project_name',
        'pricing_tier',
        'guarantor_notes',
        'is_blocked_defaulter',
    ];

    protected $casts = [
        'is_blocked_defaulter' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
