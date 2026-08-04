<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CooperativeFinancing extends Model
{
    protected $table = 'cooperative_financing';

    protected $fillable = [
        'cooperative_id',
        'business_id',
        'member_id',
        'override_by_user_id',
        'financing_type',
        'status',
        'amount_requested',
        'amount_disbursed',
        'capital_amount',
        'cooperative_capital',
        'member_capital',
        'profit_share_cooperative',
        'profit_share_member',
        'profit_share_ratio',
        'business_description',
        'duration_months',
        'repayment_due_date',
        'late_penalty_amount',
        'late_penalty_destination',
        'admin_override_reason',
        'submitted_at',
        'approved_at',
        'disbursed_at',
        'closed_at',
        'guarantee_snapshot',
        'metadata',
    ];

    protected $casts = [
        'amount_requested' => 'decimal:2',
        'amount_disbursed' => 'decimal:2',
        'capital_amount' => 'decimal:2',
        'cooperative_capital' => 'decimal:2',
        'member_capital' => 'decimal:2',
        'profit_share_cooperative' => 'decimal:2',
        'profit_share_member' => 'decimal:2',
        'repayment_due_date' => 'date',
        'late_penalty_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'closed_at' => 'datetime',
        'guarantee_snapshot' => 'array',
        'metadata' => 'array',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(CooperativeMember::class, 'member_id');
    }

    public function guarantors(): HasMany
    {
        return $this->hasMany(CooperativeGuarantor::class, 'financing_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(CooperativeFinancingReport::class, 'financing_id');
    }
}
