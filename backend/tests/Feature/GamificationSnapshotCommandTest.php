<?php

namespace Tests\Feature;

use App\Models\BusinessHealthSnapshot;
use App\Models\BusinessStreak;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GamificationSnapshotCommandTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_command_stores_a_health_snapshot_for_every_business(): void
    {
        $tenantA = $this->createTenantContext('retail', 'snapshot-a@example.com');
        $tenantB = $this->createTenantContext('retail', 'snapshot-b@example.com');

        Artisan::call('taska:compute-gamification-snapshots');

        $this->assertSame(1, BusinessHealthSnapshot::where('business_id', $tenantA['business']->id)->count());
        $this->assertSame(1, BusinessHealthSnapshot::where('business_id', $tenantB['business']->id)->count());
    }

    public function test_command_extends_zero_overdue_receivables_streak_only_when_no_balance_is_owed(): void
    {
        $cleanTenant = $this->createTenantContext('retail', 'snapshot-clean@example.com');
        $owingTenant = $this->createTenantContext('retail', 'snapshot-owing@example.com');

        Customer::create([
            'business_id' => $owingTenant['business']->id,
            'name' => 'Owing Customer',
            'customer_type' => 'individual',
            'balance' => 5000,
        ]);

        Artisan::call('taska:compute-gamification-snapshots');

        $cleanStreak = BusinessStreak::where('business_id', $cleanTenant['business']->id)
            ->where('streak_type', 'zero_overdue_receivables')
            ->first();

        $owingStreak = BusinessStreak::where('business_id', $owingTenant['business']->id)
            ->where('streak_type', 'zero_overdue_receivables')
            ->first();

        $this->assertSame(1, $cleanStreak->current_count);
        $this->assertNull($owingStreak);
    }
}
