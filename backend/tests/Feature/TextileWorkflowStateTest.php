<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\TailoringJob;
use App\Models\TextileStyleOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class TextileWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_textile_business_can_progress_tailoring_jobs_to_ready(): void
    {
        $tenant = $this->createTenantContext('textile_fashion', 'textile-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Hadiza Bello',
            'phone' => '08045555555',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $styleOrder = TextileStyleOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'order_number' => 'TXT-001',
            'style_name' => 'Kaftan Set',
            'garment_type' => 'Kaftan',
            'status' => 'stitching',
            'fabric_quantity' => 4,
            'fabric_unit' => 'yard',
            'labour_charge' => 12000,
            'fabric_charge' => 8000,
            'total_amount' => 20000,
            'amount_paid' => 5000,
            'due_date' => now()->addDays(3)->toDateString(),
        ]);

        $job = TailoringJob::create([
            'business_id' => $tenant['business']->id,
            'style_order_id' => $styleOrder->id,
            'assigned_tailor' => 'Zainab',
            'stage' => 'stitching',
            'priority' => 'normal',
            'started_at' => now()->subDay(),
        ]);

        $this->patchJson("/api/textile/jobs/{$job->id}", [
            'assigned_tailor' => 'Maryam',
            'stage' => 'completed',
            'priority' => 'urgent',
            'notes' => 'Final fitting approved',
        ])->assertOk()
            ->assertJsonPath('data.assigned_tailor', 'Maryam')
            ->assertJsonPath('data.stage', 'completed')
            ->assertJsonPath('data.priority', 'urgent')
            ->assertJsonPath('data.style_order.status', 'ready')
            ->assertJsonPath('data.style_order.customer.name', 'Hadiza Bello');
    }

    public function test_textile_job_updates_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('textile_fashion', 'textile-primary@example.com');
        $otherTenant = $this->createTenantContext('textile_fashion', 'textile-secondary@example.com');

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Kabiru Musa',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $styleOrder = TextileStyleOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'order_number' => 'TXT-002',
            'style_name' => 'Agbada',
            'status' => 'cutting',
            'total_amount' => 30000,
            'amount_paid' => 0,
        ]);

        $job = TailoringJob::create([
            'business_id' => $tenant['business']->id,
            'style_order_id' => $styleOrder->id,
            'stage' => 'cutting',
            'priority' => 'normal',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/textile/jobs/{$job->id}", [
            'stage' => 'completed',
        ])->assertForbidden();
    }
}
