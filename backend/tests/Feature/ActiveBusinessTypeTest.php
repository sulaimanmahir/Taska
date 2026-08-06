<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ActiveBusinessTypeTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_new_businesses_are_provisioned_with_active_business_types_matching_business_type(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'owner-active-types@example.com');

        $this->assertSame(['restaurant'], $tenant['business']->fresh()->active_business_types);
        $this->assertTrue($tenant['business']->hasActiveBusinessType('restaurant'));
        $this->assertFalse($tenant['business']->hasActiveBusinessType('pharmacy'));
    }

    public function test_business_owner_can_self_serve_add_an_active_business_type(): void
    {
        $tenant = $this->createTenantContext('retail', 'owner-add-type@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->postJson('/api/auth/business/active-types', [
            'business_type' => 'wholesale',
        ]);

        $response->assertOk();

        $business = $tenant['business']->fresh();
        $this->assertSame(['retail', 'wholesale'], $business->active_business_types);
        $this->assertTrue($business->hasActiveBusinessType('wholesale'));
    }

    public function test_adding_the_same_active_business_type_twice_does_not_duplicate_it(): void
    {
        $tenant = $this->createTenantContext('retail', 'owner-add-type-dup@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/auth/business/active-types', ['business_type' => 'wholesale'])->assertOk();
        $this->postJson('/api/auth/business/active-types', ['business_type' => 'wholesale'])->assertOk();

        $business = $tenant['business']->fresh();
        $this->assertSame(['retail', 'wholesale'], $business->active_business_types);
    }

    public function test_adding_an_unknown_business_type_is_rejected(): void
    {
        $tenant = $this->createTenantContext('retail', 'owner-add-type-invalid@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/auth/business/active-types', ['business_type' => 'not_a_real_type'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['business_type']);

        $this->assertSame(['retail'], $tenant['business']->fresh()->active_business_types);
    }
}
