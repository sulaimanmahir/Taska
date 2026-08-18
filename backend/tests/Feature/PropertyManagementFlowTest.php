<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\PropertyLease;
use App\Models\PropertyUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PropertyManagementFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_full_unit_lease_payment_and_maintenance_flow(): void
    {
        $tenant = $this->createTenantContext('property_management', 'property-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Amina Yusuf',
            'customer_type' => 'individual',
        ]);

        $unitResponse = $this->postJson('/api/property-management/units', [
            'property_name' => 'Sabon Gari Estate',
            'unit_type' => 'apartment',
            'address' => 'Block 4, Flat 2',
            'bedrooms' => 2,
            'rent_amount' => 600000,
            'service_charge_amount' => 50000,
        ]);

        $unitResponse->assertCreated();
        $unitResponse->assertJsonPath('status', 'vacant');
        $this->assertStringStartsWith('UNIT-', $unitResponse->json('unit_code'));
        $unitId = $unitResponse->json('id');

        // A vacant unit should be visible from the units index.
        $this->getJson('/api/property-management/units')->assertOk()->assertJsonCount(1);

        $leaseResponse = $this->postJson('/api/property-management/leases', [
            'property_unit_id' => $unitId,
            'customer_id' => $customer->id,
            'start_date' => today()->toDateString(),
            'rent_amount' => 600000,
            'service_charge_amount' => 50000,
            'payment_frequency_days' => 365,
        ]);

        $leaseResponse->assertCreated();
        // The initial charge (rent + service charge) should already be on
        // the ledger and reflected in the lease's balance - a fresh lease
        // owes its first payment immediately, it doesn't start at zero.
        $leaseResponse->assertJsonPath('balance', '650000.00');
        $leaseId = $leaseResponse->json('id');

        $this->assertSame(PropertyUnit::STATUS_OCCUPIED, PropertyUnit::find($unitId)->status);

        $paymentResponse = $this->postJson("/api/property-management/leases/{$leaseId}/payments", [
            'amount' => 400000,
            'reference' => 'TXN-001',
        ]);

        $paymentResponse->assertCreated();
        $paymentResponse->assertJsonPath('lease.balance', '250000.00');
        $paymentResponse->assertJsonPath('entry.amount', '400000.00');

        $maintenanceResponse = $this->postJson('/api/property-management/maintenance-requests', [
            'property_unit_id' => $unitId,
            'title' => 'Leaking roof',
            'priority' => 'high',
        ]);

        $maintenanceResponse->assertCreated();
        $maintenanceResponse->assertJsonPath('status', 'open');
        $maintenanceResponse->assertJsonPath('priority', 'high');

        $overview = $this->getJson('/api/property-management/overview');
        $overview->assertOk();
        $overview->assertJsonPath('summary.total_units', 1);
        $overview->assertJsonPath('summary.occupied_units', 1);
        $overview->assertJsonPath('summary.vacant_units', 0);
        $overview->assertJsonPath('summary.total_outstanding_balance', 250000);
        $overview->assertJsonPath('summary.rent_collected_this_month', 400000);
        $overview->assertJsonPath('summary.open_maintenance_requests', 1);

        $leasesIndex = $this->getJson('/api/property-management/leases');
        $leasesIndex->assertOk();
        $leasesIndex->assertJsonPath('0.customer_name', 'Amina Yusuf');
        $leasesIndex->assertJsonPath('0.property_unit_code', $unitResponse->json('unit_code'));
    }

    public function test_it_rejects_a_lease_for_a_unit_belonging_to_another_business(): void
    {
        $tenant = $this->createTenantContext('property_management', 'property-owner-2@example.com');
        $other = $this->createTenantContext('property_management', 'property-other@example.com');

        $foreignUnit = PropertyUnit::create([
            'business_id' => $other['business']->id,
            'unit_code' => PropertyUnit::generateUnitCode(),
            'property_name' => 'Foreign Estate',
            'unit_type' => 'apartment',
            'rent_amount' => 300000,
            'status' => PropertyUnit::STATUS_VACANT,
        ]);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Tenant',
            'customer_type' => 'individual',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/property-management/leases', [
            'property_unit_id' => $foreignUnit->id,
            'customer_id' => $customer->id,
            'start_date' => today()->toDateString(),
            'rent_amount' => 300000,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['property_unit_id']);
    }

    public function test_units_and_leases_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('property_management', 'property-owner-3@example.com');
        $other = $this->createTenantContext('property_management', 'property-other-2@example.com');

        $foreignCustomer = Customer::create([
            'business_id' => $other['business']->id,
            'name' => 'Foreign Tenant',
            'customer_type' => 'individual',
        ]);

        $foreignUnit = PropertyUnit::create([
            'business_id' => $other['business']->id,
            'unit_code' => PropertyUnit::generateUnitCode(),
            'property_name' => 'Foreign Estate',
            'unit_type' => 'apartment',
            'rent_amount' => 300000,
            'status' => PropertyUnit::STATUS_VACANT,
        ]);

        PropertyLease::create([
            'business_id' => $other['business']->id,
            'property_unit_id' => $foreignUnit->id,
            'customer_id' => $foreignCustomer->id,
            'start_date' => today(),
            'rent_amount' => 300000,
            'balance' => 300000,
            'status' => PropertyLease::STATUS_ACTIVE,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/property-management/units')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/property-management/leases')->assertOk()->assertJsonCount(0);
        $this->assertCount(0, PropertyUnit::all());
        $this->assertCount(0, PropertyLease::all());
    }
}
