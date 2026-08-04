<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Business;
use App\Services\BusinessProvisioningService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

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
