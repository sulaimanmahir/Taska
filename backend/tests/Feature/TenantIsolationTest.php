<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_customer_record_is_isolated_per_business(): void
    {
        $tenantA = $this->createTenantContext('retail', 'tenant-a@example.com');
        $tenantB = $this->createTenantContext('retail', 'tenant-b@example.com');

        $customer = Customer::create([
            'business_id' => $tenantA['business']->id,
            'branch_id' => $tenantA['branch']->id,
            'name' => 'Protected Customer',
            'phone' => '08035555555',
        ]);

        Sanctum::actingAs($tenantB['user']);

        $this->getJson("/api/customers/{$customer->id}")
            ->assertForbidden();
    }
}
