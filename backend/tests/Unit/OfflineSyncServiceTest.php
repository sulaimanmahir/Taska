<?php

namespace Tests\Unit;

use App\Services\OfflineSyncService;
use Tests\TestCase;

class OfflineSyncServiceTest extends TestCase
{
    public function test_inventory_conflicts_require_review_queue(): void
    {
        $service = new OfflineSyncService();

        $result = $service->resolveConflict('inventory', ['quantity' => 10], ['quantity' => 8]);

        $this->assertSame('review_queue', $result['strategy']);
        $this->assertSame('review_queue', $result['winner']);
    }

    public function test_finance_conflicts_require_manual_review(): void
    {
        $service = new OfflineSyncService();

        $result = $service->resolveConflict('finance', ['amount' => 100], ['amount' => 120]);

        $this->assertSame('manual_review', $result['strategy']);
        $this->assertNull($result['payload']);
    }

    public function test_low_risk_conflicts_use_last_write_wins(): void
    {
        $service = new OfflineSyncService();

        $result = $service->resolveConflict(
            'customer',
            ['name' => 'Local', 'local_timestamp' => now()->toISOString()],
            ['name' => 'Remote', 'local_timestamp' => now()->subMinute()->toISOString()]
        );

        $this->assertSame('last_write_wins', $result['strategy']);
        $this->assertSame('local', $result['winner']);
        $this->assertSame('Local', $result['payload']['name']);
    }
}
