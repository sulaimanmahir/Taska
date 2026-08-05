<?php

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BelongsToBusinessScopeTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_business_scope_hides_other_tenants_records_even_without_a_manual_filter(): void
    {
        $tenant = $this->createTenantContext('retail', 'scope-owner@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'scope-foreign@example.com');

        Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Product',
            'selling_price' => 500,
        ]);

        Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Product',
            'selling_price' => 500,
        ]);

        Customer::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Customer',
            'customer_type' => 'individual',
        ]);

        Sanctum::actingAs($tenant['user']);

        // Deliberately unscoped queries - no ->where('business_id', ...) - to prove
        // the global scope, not controller code, is what keeps the other tenant out.
        $visibleProducts = Product::all();
        $visibleCustomers = Customer::all();

        $this->assertCount(1, $visibleProducts);
        $this->assertSame('Local Product', $visibleProducts->first()->name);
        $this->assertCount(0, $visibleCustomers);
    }

    public function test_business_scope_no_ops_outside_an_authenticated_request(): void
    {
        $tenant = $this->createTenantContext('retail', 'scope-console@example.com');

        Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Console Created Product',
            'selling_price' => 500,
        ]);

        // No Sanctum::actingAs() here - simulates a console command / seeder / unit
        // test running outside an HTTP request, which must still see all records.
        $this->assertCount(1, Product::all());
    }
}
