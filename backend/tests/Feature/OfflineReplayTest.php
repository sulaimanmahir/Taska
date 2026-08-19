<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class OfflineReplayTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    private function authHeader(array $tenant): array
    {
        $token = $tenant['user']->createToken('offline-replay-test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_last_write_wins_actions_replay_through_the_real_endpoint(): void
    {
        $tenant = $this->createTenantContext('retail', 'offline-lww@example.com');

        $response = $this->postJson('/api/offline/replay', [
            'actions' => [[
                'id' => 'local-1',
                'endpoint' => '/customers',
                'method' => 'POST',
                'resource_type' => 'general',
                'payload' => ['name' => 'Offline Customer', 'phone' => '08010000001'],
            ]],
        ], $this->authHeader($tenant))->assertOk();

        $results = $response->json('results');
        $this->assertSame('synced', $results[0]['status']);
        $this->assertSame('Offline Customer', $results[0]['response']['name']);
        $this->assertDatabaseHas('customers', ['name' => 'Offline Customer', 'business_id' => $tenant['business']->id]);
    }

    public function test_review_queue_strategy_reports_conflict_when_record_changed_since_snapshot(): void
    {
        $tenant = $this->createTenantContext('retail', 'offline-conflict@example.com');

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Original Name',
            'phone' => '08020000002',
        ]);

        $baseUpdatedAt = $customer->updated_at->toJSON();

        $customer->forceFill(['name' => 'Changed On Server', 'updated_at' => now()->addMinutes(5)])->save();

        $response = $this->postJson('/api/offline/replay', [
            'actions' => [[
                'id' => 'local-2',
                'endpoint' => "/customers/{$customer->id}",
                'method' => 'PATCH',
                'resource_type' => 'inventory',
                'base_updated_at' => $baseUpdatedAt,
                'payload' => ['name' => 'Offline Edit'],
            ]],
        ], $this->authHeader($tenant))->assertOk();

        $results = $response->json('results');
        $this->assertSame('conflict', $results[0]['status']);
        $this->assertSame('review_queue', $results[0]['strategy']);
        $this->assertSame('Changed On Server', $results[0]['current']['name']);
        $this->assertSame('Changed On Server', $customer->fresh()->name);
    }

    public function test_forced_replay_overwrites_despite_a_conflict(): void
    {
        $tenant = $this->createTenantContext('retail', 'offline-force@example.com');

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Original Name',
            'phone' => '08030000003',
        ]);

        $baseUpdatedAt = $customer->updated_at->toJSON();
        $customer->forceFill(['name' => 'Changed On Server', 'updated_at' => now()->addMinutes(5)])->save();

        $response = $this->postJson('/api/offline/replay', [
            'actions' => [[
                'id' => 'local-3',
                'endpoint' => "/customers/{$customer->id}",
                'method' => 'PATCH',
                'resource_type' => 'inventory',
                'base_updated_at' => $baseUpdatedAt,
                'force' => true,
                'payload' => ['name' => 'Offline Edit Forced'],
            ]],
        ], $this->authHeader($tenant))->assertOk();

        $results = $response->json('results');
        $this->assertSame('synced', $results[0]['status']);
        $this->assertSame('Offline Edit Forced', $customer->fresh()->name);
    }

    public function test_a_failed_action_reports_the_validation_error_without_aborting_the_batch(): void
    {
        $tenant = $this->createTenantContext('retail', 'offline-fail@example.com');

        $response = $this->postJson('/api/offline/replay', [
            'actions' => [
                [
                    'id' => 'local-4a',
                    'endpoint' => '/customers',
                    'method' => 'POST',
                    'resource_type' => 'general',
                    'payload' => [],
                ],
                [
                    'id' => 'local-4b',
                    'endpoint' => '/customers',
                    'method' => 'POST',
                    'resource_type' => 'general',
                    'payload' => ['name' => 'Second Customer', 'phone' => '08040000004'],
                ],
            ],
        ], $this->authHeader($tenant))->assertOk();

        $results = $response->json('results');
        $this->assertSame('failed', $results[0]['status']);
        $this->assertSame('synced', $results[1]['status']);
    }
}
