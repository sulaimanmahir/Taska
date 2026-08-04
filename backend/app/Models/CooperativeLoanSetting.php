<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeLoanSetting extends Model
{
    protected $fillable = [
        'cooperative_id',
        'required_guarantors',
        'min_shares_per_guarantor',
        'min_combined_guarantor_shares',
        'borrower_min_shares',
        'loan_limit_mode',
        'loan_limit_value',
        'lock_borrower_shares',
        'lock_guarantor_shares',
        'liability_mode',
        'allow_admin_override',
        'custom_liability_notes',
    ];

    protected $casts = [
        'loan_limit_value' => 'decimal:2',
        'lock_borrower_shares' => 'boolean',
        'lock_guarantor_shares' => 'boolean',
        'allow_admin_override' => 'boolean',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }
}
