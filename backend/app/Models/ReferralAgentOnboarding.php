<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralAgentOnboarding extends Model
{
    protected $table = 'referral_agent_onboarding';

    protected $fillable = [
        'agent_id',
        'step',
        'step_name',
        'is_completed',
        'completed_at',
        'data',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'data' => 'array',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(ReferralAgent::class, 'agent_id');
    }

    public function markComplete(array $data = []): void
    {
        $this->is_completed = true;
        $this->completed_at = now();
        if (!empty($data)) {
            $this->data = array_merge($this->data ?? [], $data);
        }
        $this->save();
    }
}
