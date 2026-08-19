<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\AiInsight;
use App\Models\Business;
use App\Models\BusinessStreak;
use App\Models\Customer;
use App\Models\User;
use App\Services\AiService;
use App\Services\BusinessHealthScoringService;
use App\Services\BusinessProvisioningService;
use App\Services\PushNotificationService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('taska:compute-gamification-snapshots', function (BusinessHealthScoringService $healthScoringService) {
    $businesses = Business::query()->orderBy('id')->get();
    $this->info("Computing gamification snapshots for {$businesses->count()} business(es)...");

    foreach ($businesses as $business) {
        $healthScoringService->computeAndStoreFor($business);

        // zero_overdue_receivables is a state check ("is the ledger clean
        // right now"), not a discrete created-event like a sale or expense,
        // so it belongs in the daily snapshot job rather than
        // GamificationObserver (see docs/TASKA_DESIGN_CONSTITUTION.md).
        $hasOutstandingBalance = Customer::where('business_id', $business->id)
            ->where('balance', '>', 0)
            ->exists();

        if (!$hasOutstandingBalance) {
            $streak = BusinessStreak::firstOrCreate([
                'business_id' => $business->id,
                'streak_type' => 'zero_overdue_receivables',
            ]);

            $streak->recordActivity();
        }

        $this->line("Business #{$business->id}: snapshot stored.");
    }

    $this->info('Done.');
})->purpose('Compute and store daily health snapshots, and extend the zero-overdue-receivables streak for businesses with no outstanding customer balance');

Artisan::command('taska:send-critical-alerts', function (AiService $aiService, PushNotificationService $pushService) {
    if (!$pushService->isConfigured()) {
        $this->warn('VAPID keys are not configured - skipping (see .env.example).');
        return;
    }

    $businesses = Business::query()->orderBy('id')->get();
    $this->info("Checking {$businesses->count()} business(es) for critical alerts...");
    $totalSent = 0;

    foreach ($businesses as $business) {
        // generateInsights() is idempotent (syncInsight() upserts by type,
        // see AiService) - safe to call from a scheduled job even though
        // it's normally triggered lazily by a user viewing /ai/insights.
        $aiService->generateInsights($business->id);

        $criticalInsights = AiInsight::where('business_id', $business->id)
            ->where('severity', 'critical')
            ->where('is_dismissed', false)
            ->whereNull('notified_at')
            ->get();

        foreach ($criticalInsights as $insight) {
            $result = $pushService->sendToBusiness($business, $insight->title, $insight->description, '/ai-insights');
            $insight->update(['notified_at' => now()]);
            $totalSent += $result['sent'];
        }
    }

    $this->info("Done. Sent {$totalSent} push notification(s).");
})->purpose('Push a notification for any new critical AI insight across every business');

Artisan::command('taska:repair-business-state {--business_id=} {--dry-run}', function (BusinessProvisioningService $provisioningService) {
    $businessId = $this->option('business_id');
    $dryRun = (bool) $this->option('dry-run');

    $query = Business::query()->orderBy('id');

    if ($businessId) {
        $query->where('id', (int) $businessId);
    }

    $businesses = $query->get();

    if ($businesses->isEmpty()) {
        $this->warn('No matching businesses found.');
        return;
    }

    $this->info("Inspecting {$businesses->count()} business(es)...");

    foreach ($businesses as $business) {
        if ($dryRun) {
            $this->line("Business #{$business->id} {$business->name}");
            continue;
        }

        $result = $provisioningService->repairBusinessState($business);
        $subscriptionText = $result['created_trial_subscription'] ? 'trial created' : 'trial unchanged';
        $this->line("Business #{$business->id}: synced {$result['synced_roles']} role(s), {$subscriptionText}");
    }

    $this->info($dryRun ? 'Dry run complete.' : 'Repair complete.');
})->purpose('Backfill role permissions and trial subscriptions for existing businesses');

Artisan::command('taska:grant-platform-admin {email}', function (string $email) {
    $user = User::where('email', $email)->first();

    if (! $user) {
        $this->error("No user found with email {$email}.");
        return 1;
    }

    $user->forceFill(['is_platform_admin' => true])->save();
    $this->info("Granted platform admin to {$user->email} (#{$user->id}).");
})->purpose('Grant the platform-wide /api/admin/* dashboard to a specific user by email - this is separate from the tenant-scoped "admin" business role every owner already has');

Artisan::command('taska:revoke-platform-admin {email}', function (string $email) {
    $user = User::where('email', $email)->first();

    if (! $user) {
        $this->error("No user found with email {$email}.");
        return 1;
    }

    $user->forceFill(['is_platform_admin' => false])->save();
    $this->info("Revoked platform admin from {$user->email} (#{$user->id}).");
})->purpose('Revoke a user\'s platform-wide admin dashboard access');
