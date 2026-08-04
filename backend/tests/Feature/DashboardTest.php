<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_dashboard_loads_for_authenticated_user(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'dashboard@example.com');

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'business_type',
                'today_sales',
                'today_orders',
                'customers_count',
                'low_stock_count',
                'delivery' => ['pickups_pending', 'in_transit', 'completed_today', 'ageing_parcels', 'open_complaints', 'wallet_outflow_today'],
                'owner_focus' => [
                    'profit_driver',
                    'profit_killers',
                    'fraud_losses',
                    'daily_decisions',
                    'monthly_reports',
                    'feature_highlights',
                ],
            ]);
    }
}
