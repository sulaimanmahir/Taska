<?php

namespace Tests\Feature;

use App\Models\SupportTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class SupportTicketControllerTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_a_team_member_can_file_a_ticket_and_see_it_listed(): void
    {
        $tenant = $this->createTenantContext('retail', 'support-file@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->postJson('/api/support-tickets', [
            'subject' => 'Cannot print receipts',
            'message' => 'The receipt printer stopped responding after the last update.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.subject', 'Cannot print receipts')
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('support_tickets', [
            'business_id' => $tenant['business']->id,
            'created_by' => $tenant['user']->id,
            'subject' => 'Cannot print receipts',
            'status' => 'open',
        ]);

        $this->getJson('/api/support-tickets')
            ->assertOk()
            ->assertJsonPath('data.0.subject', 'Cannot print receipts');
    }

    public function test_filing_a_ticket_requires_a_subject_and_message(): void
    {
        $tenant = $this->createTenantContext('retail', 'support-validate@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/support-tickets', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subject', 'message']);
    }

    public function test_a_business_only_sees_its_own_tickets(): void
    {
        $tenantA = $this->createTenantContext('retail', 'support-scope-a@example.com');
        $tenantB = $this->createTenantContext('retail', 'support-scope-b@example.com');

        SupportTicket::create([
            'business_id' => $tenantB['business']->id,
            'created_by' => $tenantB['user']->id,
            'subject' => 'Business B ticket',
            'message' => 'Only business B should see this.',
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        Sanctum::actingAs($tenantA['user']);

        $response = $this->getJson('/api/support-tickets')->assertOk();

        $this->assertCount(0, $response->json('data'));
    }

    public function test_a_resolved_ticket_shows_as_resolved_once_the_platform_admin_resolves_it(): void
    {
        $tenant = $this->createTenantContext('retail', 'support-resolve-flow@example.com');
        Sanctum::actingAs($tenant['user']);

        $ticket = SupportTicket::create([
            'business_id' => $tenant['business']->id,
            'created_by' => $tenant['user']->id,
            'subject' => 'Need help exporting reports',
            'message' => 'The export button does nothing.',
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        $platformAdminTenant = $this->createTenantContext('retail', 'support-resolve-admin@example.com');
        $platformAdminTenant['user']->forceFill(['is_platform_admin' => true])->save();
        Sanctum::actingAs($platformAdminTenant['user']);

        $this->postJson('/api/admin/resolve-ticket', ['id' => $ticket->id])->assertOk();

        Sanctum::actingAs($tenant['user']);
        $this->getJson('/api/support-tickets')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'resolved');
    }
}
