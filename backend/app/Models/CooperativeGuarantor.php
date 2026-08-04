<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeGuarantor extends Model
{
    protected $fillable = [
        'financing_id',
        'guarantor_member_id',
        'status',
        'shares_committed',
        'liability_share_percent',
        'approved_at',
        'rejected_at',
        'notes',
    ];

    protected $casts = [
        'shares_committed' => 'decimal:2',
        'liability_share_percent' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function financing(): BelongsTo
    {
        return $this->belongsTo(CooperativeFinancing::class, 'financing_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(CooperativeMember::class, 'guarantor_member_id');
    }
}
