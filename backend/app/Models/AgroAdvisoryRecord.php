<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgroAdvisoryRecord extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'farmer_name',
        'region_name',
        'advisory_type',
        'crop_or_input',
        'recommendation',
        'follow_up_status',
        'advised_on',
        'follow_up_date',
    ];

    protected $casts = [
        'advised_on' => 'date',
        'follow_up_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
