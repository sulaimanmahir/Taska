<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CustomerWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_updates_and_shows_customers_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('retail', 'customer-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $groupResponse = $this->postJson('/api/customer-groups', [
            'name' => 'VIP Buyers',
            'discount_percent' => 7.5,
            'description' => 'Top repeat customers',
        ])->assertCreated();

        $groupId = $groupResponse->json('id');

        $groupResponse
            ->assertJsonPath('name', 'VIP Buyers')
            ->assertJsonPath('slug', 'vip-buyers');

        $customerResponse = $this->postJson('/api/customers', [
            'name' => 'Amina Stores',
            'phone' => '08030051111',
            'customer_group_id' => $groupId,
            'credit_limit' => 50000,
            'customer_type' => 'retailer',
        ])->assertCreated();

        $customerId = $customerResponse->json('id');

        $customerResponse
            ->assertJsonPath('name', 'Amina Stores')
            ->assertJsonPath('group.name', 'VIP Buyers')
            ->assertJsonPath('credit_limit', '50000.00');

        $this->patchJson("/api/customers/{$customerId}", [
            'city' => 'Kano',
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('city', 'Kano')
            ->assertJsonPath('is_active', true);

        $this->getJson("/api/customers/{$customerId}")
            ->assertOk()
            ->assertJsonPath('name', 'Amina Stores')
            ->assertJsonPath('group.name', 'VIP Buyers');

        $this->patchJson("/api/customer-groups/{$groupId}", [
            'name' => 'VIP Wholesale Buyers',
        ])
            ->assertOk()
            ->assertJsonPath('name', 'VIP Wholesale Buyers')
            ->assertJsonPath('slug', 'vip-wholesale-buyers');
    }

    public function test_it_rejects_foreign_tenant_customer_group_links_and_actions(): void
    {
        $tenant = $this->createTenantContext('retail', 'customer-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'customer-scope-other@example.com');

        $foreignGroup = CustomerGroup::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Group',
            'slug' => 'foreign-group',
            'discount_percent' => 5,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Buyer',
            'phone' => '08030052222',
            'customer_group_id' => $foreignGroup->id,
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/customers', [
            'name' => 'Invalid Link',
            'customer_group_id' => $foreignGroup->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_group_id']);

        $this->patchJson("/api/customers/{$foreignCustomer->id}", [
            'name' => 'Hijacked Customer',
        ])->assertStatus(403);

        $this->patchJson("/api/customer-groups/{$foreignGroup->id}", [
            'name' => 'Hijacked Group',
        ])->assertStatus(403);
    }
}
