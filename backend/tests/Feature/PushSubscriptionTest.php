<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_a_user_can_subscribe_and_the_subscription_is_tenant_and_user_scoped(): void
    {
        $tenant = $this->createTenantContext('retail', 'push-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/push-subscriptions', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'keys' => ['p256dh' => 'test-p256dh-key', 'auth' => 'test-auth-token'],
        ])->assertCreated();

        $subscription = PushSubscription::first();
        $this->assertNotNull($subscription);
        $this->assertSame($tenant['business']->id, $subscription->business_id);
        $this->assertSame($tenant['user']->id, $subscription->user_id);
        $this->assertSame(PushSubscription::hashEndpoint('https://fcm.googleapis.com/fcm/send/abc123'), $subscription->endpoint_hash);
    }

    public function test_resubscribing_with_the_same_endpoint_updates_rather_than_duplicates(): void
    {
        $tenant = $this->createTenantContext('retail', 'push-owner-2@example.com');
        Sanctum::actingAs($tenant['user']);

        $endpoint = 'https://fcm.googleapis.com/fcm/send/xyz789';

        $this->postJson('/api/push-subscriptions', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'first-key', 'auth' => 'first-auth'],
        ])->assertCreated();

        $this->postJson('/api/push-subscriptions', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'rotated-key', 'auth' => 'rotated-auth'],
        ])->assertCreated();

        $this->assertSame(1, PushSubscription::count());
        $this->assertSame('rotated-key', PushSubscription::first()->p256dh_key);
    }

    public function test_a_user_can_unsubscribe(): void
    {
        $tenant = $this->createTenantContext('retail', 'push-owner-3@example.com');
        Sanctum::actingAs($tenant['user']);

        $endpoint = 'https://fcm.googleapis.com/fcm/send/removeme';

        $this->postJson('/api/push-subscriptions', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'k', 'auth' => 'a'],
        ])->assertCreated();

        $this->deleteJson('/api/push-subscriptions', ['endpoint' => $endpoint])->assertOk();

        $this->assertSame(0, PushSubscription::count());
    }

    public function test_public_key_endpoint_reports_whether_push_is_configured(): void
    {
        $tenant = $this->createTenantContext('retail', 'push-owner-4@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/push-subscriptions/public-key')->assertOk();

        $this->assertArrayHasKey('public_key', $response->json());
        $this->assertArrayHasKey('configured', $response->json());
    }
}
