<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CooperativeBrandingSetting extends Model
{
    protected $fillable = [
        'cooperative_id',
        'branding_tier',
        'logo_url',
        'primary_color',
        'secondary_color',
        'remove_powered_by_taska',
        'custom_domain',
        'custom_tagline',
    ];

    protected $casts = [
        'remove_powered_by_taska' => 'boolean',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }
}
