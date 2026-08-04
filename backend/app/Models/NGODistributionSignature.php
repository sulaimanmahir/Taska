<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NGODistributionSignature extends Model
{
    protected $table = 'ngo_distribution_signatures';

    protected $fillable = [
        'distribution_id',
        'beneficiary_name',
        'signed_by',
        'signature_reference',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(NGODistribution::class, 'distribution_id');
    }
}
