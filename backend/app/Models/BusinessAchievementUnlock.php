<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessAchievementUnlock extends Model
{
    use BelongsToBusiness;

    public const CATEGORY_ACHIEVEMENT = 'achievement';
    public const CATEGORY_MILESTONE = 'milestone';

    protected $fillable = [
        'business_id',
        'achievement_key',
        'category',
        'unlocked_at',
        'meta',
    ];

    protected $casts = [
        'unlocked_at' => 'datetime',
        'meta' => 'array',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
