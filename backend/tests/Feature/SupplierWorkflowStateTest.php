<?php

namespace Tests\Feature;

use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class SupplierWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_updates_and_shows_suppliers_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'supplier-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $createResponse = $this->postJson('/api/suppliers', [
            'name' => 'Northern Distribution Ltd',
            'email' => 'supply@example.com',
            'phone' => '08030071111',
            'city' => 'Kaduna',
            'contact_person' => 'Bello Manager',
        ])->assertCreated();

        $supplierId = $createResponse->json('id');

        $createResponse
            ->assertJsonPath('name', 'Northern Distribution Ltd')
            ->assertJsonPath('contact_person', 'Bello Manager');

        $this->patchJson("/api/suppliers/{$supplierId}", [
            'state' => 'Kaduna State',
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('state', 'Kaduna State')
            ->assertJsonPath('is_active', true);

        $this->getJson("/api/suppliers/{$supplierId}")
            ->assertOk()
            ->assertJsonPath('name', 'Northern Distribution Ltd')
            ->assertJsonPath('state', 'Kaduna State');
    }

    public function test_it_rejects_foreign_tenant_supplier_reads_updates_and_deletes(): void
    {
        $tenant = $this->createTenantContext('general', 'supplier-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'supplier-scope-other@example.com');

        $foreignSupplier = Supplier::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Supplier',
            'phone' => '08030072222',
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/suppliers/{$foreignSupplier->id}")
            ->assertStatus(403);

        $this->patchJson("/api/suppliers/{$foreignSupplier->id}", [
            'name' => 'Hijacked Supplier',
        ])->assertStatus(403);

        $this->deleteJson("/api/suppliers/{$foreignSupplier->id}")
            ->assertStatus(403);
    }
}
