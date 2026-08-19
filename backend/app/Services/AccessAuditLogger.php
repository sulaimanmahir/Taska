<?php

namespace App\Services;

use App\Models\AccessAuditLog;
use App\Models\Business;
use App\Models\User;

/**
 * Records who changed access-relevant state (team member roles/branches/
 * status, branch creation/activation) and when. Deliberately separate from
 * the AI Insights / Notifications system - this is a compliance/audit trail
 * a business owner needs to trust, not an actionable alert, so it's never
 * dismissible and never expires.
 */
class AccessAuditLogger
{
    public function log(Business $business, ?User $actor, string $action, string $subjectType, int $subjectId, string $subjectLabel, array $changes = []): ?AccessAuditLog
    {
        if ($changes === [] && !in_array($action, ['member_added', 'branch_created'], true)) {
            // Nothing actually changed (e.g. an update request that re-submits
            // identical values) - don't pollute the log with a no-op entry.
            return null;
        }

        return AccessAuditLog::create([
            'business_id' => $business->id,
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'subject_label' => $subjectLabel,
            'changes' => $changes,
            'created_at' => now(),
        ]);
    }

    /**
     * Compares $before and $after for the given keys and returns only the
     * keys whose values actually differ, as {"field": {"from": ..., "to": ...}}.
     *
     * @param array<string> $keys
     */
    public function diff(array $before, array $after, array $keys): array
    {
        $changes = [];

        foreach ($keys as $key) {
            $fromValue = $before[$key] ?? null;
            $toValue = $after[$key] ?? null;

            if ($fromValue !== $toValue) {
                $changes[$key] = ['from' => $fromValue, 'to' => $toValue];
            }
        }

        return $changes;
    }
}
