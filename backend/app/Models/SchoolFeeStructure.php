<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolFeeStructure extends Model
{
    protected $fillable = [
        'business_id',
        'academic_session_id',
        'academic_term_id',
        'school_classroom_id',
        'name',
        'amount',
        'discount_amount',
        'scholarship_amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'scholarship_amount' => 'decimal:2',
    ];

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(SchoolClassroom::class, 'school_classroom_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SchoolFeePayment::class, 'school_fee_structure_id');
    }
}
