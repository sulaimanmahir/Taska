<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BeautyProductUsage extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(BeautyAppointment::class, 'appointment_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
