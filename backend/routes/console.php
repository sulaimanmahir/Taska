<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Business;
use App\Models\BusinessStreak;
use App\Models\Customer;
use App\Services\BusinessHealthScoringService;
use App\Services\BusinessProvisioningService;

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
