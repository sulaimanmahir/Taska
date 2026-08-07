<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BusinessModulesTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_returns_the_available_and_enabled_modules_for_the_current_business(): void
    {
        $tenant = $this->createTenantContext('retail', 'modules-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/auth/business/modules');

        $response->assertOk();
        $this->assertContains('loyalty', $response->json('available'));
        $this->assertContains('dashboard', $response->json('available'));
        $this->assertSame(
            config('business_types.types.retail.modules'),
            $response->json('enabled'),
        );
    }

    public function test_business_owner_can_disable_and_reenable_a_module(): void
    {
        $tenant = $this->createTenantContext('retail', 'modules-owner-2@example.com');
        Sanctum::actingAs($tenant['user']);

        $allModules = config('business_types.types.retail.modules');
        $withoutLoyalty = array_values(array_diff($allModules, ['loyalty']));

        $response = $this->patchJson('/api/auth/business/modules', ['modules' => $withoutLoyalty]);

        $response->assertOk();
        $enabled = $tenant['business']->fresh()->modules;
        $this->assertNotContains('loyalty', $enabled);
        $this->assertContains('pos', $enabled);
    }

    public function test_dashboard_module_cannot_be_disabled(): void
    {
        $tenant = $this->createTenantContext('retail', 'modules-owner-3@example.com');
        Sanctum::actingAs($tenant['user']);

        $allModules = config('business_types.types.retail.modules');
        $withoutDashboard = array_values(array_diff($allModules, ['dashboard']));

        $this->patchJson('/api/auth/business/modules', ['modules' => $withoutDashboard])->assertOk();

        $this->assertContains('dashboard', $tenant['business']->fresh()->modules);
    }

    public function test_it_rejects_a_module_not_valid_for_the_business_type(): void
    {
        $tenant = $this->createTenantContext('retail', 'modules-owner-4@example.com');
        Sanctum::actingAs($tenant['user']);

        // "prescriptions" is a pharmacy/clinic module, not a retail one.
        $this->patchJson('/api/auth/business/modules', ['modules' => ['dashboard', 'prescriptions']])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['modules.1']);
    }

    public function test_modules_endpoints_require_authentication(): void
    {
        $this->getJson('/api/auth/business/modules')->assertStatus(401);
        $this->patchJson('/api/auth/business/modules', ['modules' => []])->assertStatus(401);
    }
}
