<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NGODistribution extends Model
{
    protected $table = 'ngo_distributions';

    protected $fillable = [
        'business_id',
        'branch_id',
        'partner_request_id',
        'donor_source_id',
        'distribution_reference',
        'beneficiary_name',
        'destination_location',
        'status',
        'distributed_on',
        'created_by',
    ];

    protected $casts = [
        'distributed_on' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(NGODistributionItem::class, 'distribution_id');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(NGODistributionSignature::class, 'distribution_id');
    }
}
