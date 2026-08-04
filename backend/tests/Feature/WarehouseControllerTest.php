<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\BusinessProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_only_returns_warehouses_for_the_current_business(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        Warehouse::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Outlet Store',
            'slug' => 'outlet-store',
            'is_default' => false,
            'is_active' => true,
        ]);

        $otherBusiness = Business::create([
            'name' => 'Other Workspace',
            'slug' => 'other-workspace',
            'email' => 'other@example.com',
            'business_type' => 'retail',
            'business_category' => 'commerce',
            'modules' => config('business_types.types.retail.modules', []),
        ]);
        $otherBranch = Branch::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Other Branch',
            'slug' => 'other-branch',
            'is_primary' => true,
            'is_active' => true,
        ]);
        Warehouse::create([
            'business_id' => $otherBusiness->id,
            'branch_id' => $otherBranch->id,
            'name' => 'Other Warehouse',
            'slug' => 'other-warehouse',
            'is_default' => true,
            'is_active' => true,
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/warehouses');

        $response->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonMissing(['name' => 'Other Warehouse']);
    }

    public function test_store_creates_a_scoped_warehouse_and_promotes_it_to_default_when_requested(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/warehouses', [
                'branch_id' => $branch->id,
                'name' => 'Cold Room',
                'description' => 'Finished goods cold room',
                'address' => '12 Depot Road',
                'is_default' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Warehouse created successfully.')
            ->assertJsonPath('warehouse.name', 'Cold Room')
            ->assertJsonPath('warehouse.branch.id', $branch->id)
            ->assertJsonPath('warehouse.is_default', true);

        $newWarehouse = Warehouse::where('business_id', $business->id)
            ->where('name', 'Cold Room')
            ->firstOrFail();

        $this->assertDatabaseHas('warehouses', [
            'id' => $newWarehouse->id,
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'slug' => 'cold-room',
            'is_default' => true,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('warehouses', [
            'business_id' => $business->id,
            'slug' => 'main-warehouse',
            'is_default' => false,
        ]);
    }

    public function test_update_can_reassign_default_warehouse_and_scope_branch_changes(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $secondaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Annex',
            'slug' => 'annex',
            'is_primary' => false,
            'is_active' => true,
        ]);
        $secondaryWarehouse = Warehouse::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Overflow Store',
            'slug' => 'overflow-store',
            'is_default' => false,
            'is_active' => true,
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/warehouses/{$secondaryWarehouse->id}", [
                'branch_id' => $secondaryBranch->id,
                'name' => 'Overflow Store East',
                'description' => 'Secondary dispatch stock',
                'address' => '7 Storage Close',
                'is_default' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Warehouse updated successfully.')
            ->assertJsonPath('warehouse.name', 'Overflow Store East')
            ->assertJsonPath('warehouse.branch.id', $secondaryBranch->id)
            ->assertJsonPath('warehouse.is_default', true);

        $this->assertDatabaseHas('warehouses', [
            'id' => $secondaryWarehouse->id,
            'branch_id' => $secondaryBranch->id,
            'name' => 'Overflow Store East',
            'description' => 'Secondary dispatch stock',
            'address' => '7 Storage Close',
            'is_default' => true,
        ]);

        $this->assertDatabaseHas('warehouses', [
            'business_id' => $business->id,
            'slug' => 'main-warehouse',
            'is_default' => false,
        ]);
    }

    public function test_update_cannot_touch_a_warehouse_from_another_business(): void
    {
        ['owner' => $owner] = $this->createProvisionedWorkspace();
        ['business' => $otherBusiness, 'branch' => $otherBranch] = $this->createSeparateBusiness();
        $foreignWarehouse = Warehouse::create([
            'business_id' => $otherBusiness->id,
            'branch_id' => $otherBranch->id,
            'name' => 'Foreign Store',
            'slug' => 'foreign-store',
            'is_default' => true,
            'is_active' => true,
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/warehouses/{$foreignWarehouse->id}", [
                'name' => 'Should Not Change',
            ])
            ->assertNotFound()
            ->assertJsonPath('message', 'Warehouse not found for this workspace.');
    }

    public function test_update_cannot_deactivate_the_last_active_warehouse(): void
    {
        ['owner' => $owner, 'business' => $business] = $this->createProvisionedWorkspace();
        $defaultWarehouse = Warehouse::where('business_id', $business->id)
            ->where('is_default', true)
            ->firstOrFail();
        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/warehouses/{$defaultWarehouse->id}", [
                'is_active' => false,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['is_active']);
    }

    private function createProvisionedWorkspace(): array
    {
        $owner = User::factory()->create([
            'name' => 'Business Owner',
            'email' => 'owner@example.com',
            'phone' => '08030000000',
            'role' => 'admin',
        ]);

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);

        $result = $provisioning->createBusinessForUser($owner, [
            'business_name' => 'Taska Retail',
            'business_email' => 'retail@example.com',
            'business_type' => 'retail',
            'business_category' => 'commerce',
            'business_location' => '12 Market Road',
            'primary_branch_name' => 'HQ',
            'contact_phone' => '08030000000',
            'role' => 'admin',
        ]);

        return [
            'owner' => $owner->fresh(),
            'business' => $result['business']->fresh(),
            'branch' => $result['branch']->fresh(),
        ];
    }

    private function createSeparateBusiness(): array
    {
        $owner = User::factory()->create([
            'name' => 'Other Owner',
            'email' => 'other-owner@example.com',
            'phone' => '08035550000',
            'role' => 'admin',
        ]);

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);

        $result = $provisioning->createBusinessForUser($owner, [
            'business_name' => 'Taska Fuel',
            'business_email' => 'fuel@example.com',
            'business_type' => 'fuel_business',
            'business_category' => 'energy',
            'business_location' => '8 Station Road',
            'primary_branch_name' => 'Fuel HQ',
            'contact_phone' => '08035550000',
            'role' => 'admin',
        ]);

        return [
            'owner' => $owner->fresh(),
            'business' => $result['business']->fresh(),
            'branch' => $result['branch']->fresh(),
        ];
    }
}
