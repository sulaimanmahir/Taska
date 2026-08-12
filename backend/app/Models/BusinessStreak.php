<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class BusinessStreak extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'streak_type',
        'current_count',
        'best_count',
        'last_active_date',
    ];

    protected $casts = [
        'current_count' => 'integer',
        'best_count' => 'integer',
        'last_active_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Record that the qualifying action happened "today" for this streak.
     * Consecutive calendar days extend the streak; a gap resets it to 1;
     * calling it twice in the same day is a no-op. Never lets an event
     * source silently double-count or corrupt the streak on retry/replay.
     */
    public function recordActivity(?Carbon $on = null): void
    {
        $today = ($on ?? now())->startOfDay();
        $last = $this->last_active_date?->copy()->startOfDay();

        if ($last?->isSameDay($today)) {
            return;
        }

        $this->current_count = $last?->isSameDay($today->copy()->subDay())
            ? $this->current_count + 1
            : 1;

        $this->best_count = max($this->best_count, $this->current_count);
        $this->last_active_date = $today;
        $this->save();
    }
}
