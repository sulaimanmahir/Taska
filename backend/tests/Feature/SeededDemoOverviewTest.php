<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SeededDemoOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_hotel_logistics_and_delivery_accounts_expose_populated_overviews(): void
    {
        $this->seed(DatabaseSeeder::class);

        $hotelUser = User::where('email', 'hotel@taska.local')->firstOrFail();
        Sanctum::actingAs($hotelUser);

        $this->getJson('/api/hotel/overview')
            ->assertOk()
            ->assertJsonPath('summary.total_rooms', 4)
            ->assertJsonPath('summary.occupied_rooms', 1)
            ->assertJsonPath('summary.blocked_rooms', 1)
            ->assertJsonPath('summary.checkins_today', 1)
            ->assertJsonPath('maintenance_open', 1)
            ->assertJsonPath('shifts_active', 1);

        $this->getJson('/api/hotel/rooms')
            ->assertOk()
            ->assertJsonCount(4);

        $this->getJson('/api/hotel/bookings')
            ->assertOk()
            ->assertJsonCount(3);

        $logisticsUser = User::where('email', 'logistics@taska.local')->firstOrFail();
        Sanctum::actingAs($logisticsUser);

        $this->getJson('/api/logistics/overview')
            ->assertOk()
            ->assertJsonPath('summary.trips_today', 1)
            ->assertJsonPath('summary.active_trips', 1)
            ->assertJsonPath('summary.delayed_stops', 1)
            ->assertJsonPath('summary.fuel_cost_today', 35500)
            ->assertJsonPath('summary.open_maintenance', 1)
            ->assertJsonCount(2, 'fleet_assets')
            ->assertJsonCount(2, 'trip_sheets')
            ->assertJsonCount(2, 'fuel_logs')
            ->assertJsonCount(2, 'maintenance_logs')
            ->assertJsonCount(2, 'settlements');

        $deliveryUser = User::where('email', 'delivery@taska.local')->firstOrFail();
        Sanctum::actingAs($deliveryUser);

        $this->getJson('/api/deliveries/overview')
            ->assertOk()
            ->assertJsonPath('summary.in_transit', 1)
            ->assertJsonPath('summary.delivered_total', 1)
            ->assertJsonPath('summary.exceptions_total', 1)
            ->assertJsonPath('summary.gross_delivery_revenue', 17400)
            ->assertJsonPath('summary.pending_remittance', 35000)
            ->assertJsonPath('summary.rider_payouts_pending', 2133)
            ->assertJsonPath('summary.investor_payouts_pending', 1975);

        $this->getJson('/api/deliveries/operations')
            ->assertOk()
            ->assertJsonCount(1, 'manifests')
            ->assertJsonCount(1, 'complaints')
            ->assertJsonCount(1, 'disputes')
            ->assertJsonCount(1, 'wallet_activity')
            ->assertJsonCount(1, 'remittance_history')
            ->assertJsonCount(2, 'manifest_candidates');

        $this->getJson('/api/deliveries')
            ->assertOk()
            ->assertJsonPath('total', 3);

        $this->getJson('/api/delivery-vehicles')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_seeded_pharmacy_restaurant_and_factory_accounts_expose_populated_vertical_overviews(): void
    {
        $this->seed(DatabaseSeeder::class);

        $pharmacyUser = User::where('email', 'pharmacy@taska.local')->firstOrFail();
        Sanctum::actingAs($pharmacyUser);

        $this->getJson('/api/pharmacy/overview')
            ->assertOk()
            ->assertJsonPath('summary.near_expiry_batches', 1)
            ->assertJsonPath('summary.discounted_batches', 2)
            ->assertJsonPath('summary.expired_units', 4)
            ->assertJsonPath('summary.controlled_logs', 1)
            ->assertJsonPath('summary.refill_pending', 1)
            ->assertJsonCount(3, 'purchase_history')
            ->assertJsonCount(1, 'near_expiry');

        $this->getJson('/api/pharmacy/substitutions')
            ->assertOk()
            ->assertJsonCount(1);

        $this->getJson('/api/pharmacy/refill-reminders')
            ->assertOk()
            ->assertJsonCount(2);

        $pharmacyDashboard = $this->getJson('/api/dashboard')
            ->assertOk()
            ->json();

        $this->assertNotEmpty($pharmacyDashboard['recent_activity']);
        $this->assertContains(
            true,
            array_map(
                fn ($type) => in_array($type, ['pharmacy_dispense', 'pharmacy_refill'], true),
                array_column($pharmacyDashboard['recent_activity'], 'type')
            )
        );
        $this->assertContains(
            true,
            array_map(
                fn ($path) => in_array($path, ['/pharmacy?section=dispense', '/pharmacy?section=refills'], true),
                array_column($pharmacyDashboard['recent_activity'], 'action_path')
            )
        );

        $restaurantUser = User::where('email', 'restaurant@taska.local')->firstOrFail();
        Sanctum::actingAs($restaurantUser);

        $this->getJson('/api/restaurant/overview')
            ->assertOk()
            ->assertJsonPath('summary.active_tables', 2)
            ->assertJsonPath('summary.upcoming_reservations', 1)
            ->assertJsonPath('summary.open_waiter_shifts', 1)
            ->assertJsonPath('summary.pending_kitchen_tickets', 1)
            ->assertJsonPath('summary.waste_cost_today', 250);

        $this->getJson('/api/restaurant/tables')
            ->assertOk()
            ->assertJsonCount(4);

        $this->getJson('/api/restaurant/kitchen-board')
            ->assertOk()
            ->assertJsonCount(1);

        $this->getJson('/api/restaurant/reservations')
            ->assertOk()
            ->assertJsonCount(1);

        $factoryUser = User::where('email', 'purewaterfactory@taska.local')->firstOrFail();
        Sanctum::actingAs($factoryUser);

        $this->getJson('/api/production/overview')
            ->assertOk()
            ->assertJsonPath('summary.units_produced_today', 390)
            ->assertJsonPath('summary.electricity_cost_today', 10500)
            ->assertJsonPath('summary.packaging_cost_today', 18400)
            ->assertJsonPath('summary.generator_fuel_today', 8400)
            ->assertJsonPath('summary.profit_estimate_today', 11500)
            ->assertJsonPath('summary.downtime_today', 40)
            ->assertJsonCount(2, 'low_stock_materials')
            ->assertJsonCount(1, 'reports.packaging_spend')
            ->assertJsonCount(2, 'reports.supplier_spend');

        $this->getJson('/api/production/batches')
            ->assertOk()
            ->assertJsonPath('total', 2);

        $this->getJson('/api/raw-materials')
            ->assertOk()
            ->assertJsonPath('total', 4);

        $factoryDashboard = $this->getJson('/api/dashboard')
            ->assertOk()
            ->json();

        $this->assertNotEmpty($factoryDashboard['recent_activity']);
        $this->assertContains(
            '/production?section=batches',
            array_column($factoryDashboard['recent_activity'], 'action_path')
        );
    }

    public function test_seeded_general_account_exposes_scheduled_adashe_cycles_and_ai_watch_items(): void
    {
        $this->seed(DatabaseSeeder::class);

        $generalUser = User::where('email', 'general@taska.local')->firstOrFail();
        Sanctum::actingAs($generalUser);

        $accountsResponse = $this->getJson('/api/trust-accounts?type=contribution')
            ->assertOk()
            ->assertJsonPath('data.0.account_type', 'contribution')
            ->assertJsonPath('data.0.cycle_name', 'Weekly Trader Circle')
            ->assertJsonPath('data.0.installment_amount', '5000.00')
            ->assertJsonPath('data.0.contribution_frequency_days', 7)
            ->assertJsonPath('summary.member_accounts', 1)
            ->assertJsonPath('summary.total_target', 40000)
            ->assertJsonPath('summary.total_collected', 28000)
            ->assertJsonPath('summary.total_paid_out', 12000)
            ->assertJsonPath('summary.due_now', 1)
            ->json();

        $this->assertStringStartsWith(
            now()->subDay()->toDateString(),
            (string) data_get($accountsResponse, 'data.0.next_due_date')
        );

        $accountId = data_get($accountsResponse, 'data.0.id');

        $this->assertNotNull($accountId);

        $this->getJson("/api/trust-accounts/{$accountId}")
            ->assertOk()
            ->assertJsonPath('account.id', $accountId)
            ->assertJsonCount(3, 'transactions');

        $this->getJson('/api/ai/insights')
            ->assertOk()
            ->assertJsonFragment(['type' => 'adashe_due_collection_pressure']);

        $dashboard = $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('adashe.member_accounts', 1)
            ->assertJsonPath('adashe.total_target', 40000)
            ->assertJsonPath('adashe.total_collected', 28000)
            ->assertJsonPath('adashe.total_paid_out', 12000)
            ->assertJsonPath('adashe.due_now', 1)
            ->assertJsonPath('adashe.average_frequency_days', 7)
            ->assertJsonPath('adashe.lead_cycle_name', 'Weekly Trader Circle')
            ->assertJsonPath('trust_fund.account_count', 2)
            ->assertJsonPath('trust_fund.total_extended', 180000)
            ->assertJsonPath('trust_fund.total_outstanding', 118000)
            ->assertJsonPath('trust_fund.total_collected', 34000)
            ->assertJsonPath('trust_fund.active_balance_accounts', 2)
            ->assertJsonPath('trust_fund.overdue_accounts', 0)
            ->assertJsonPath('trust_fund.lead_customer_name', 'Amina Bello')
            ->json();

        $this->assertNotEmpty($dashboard['top_products']);
        $this->assertNotEmpty($dashboard['top_products'][0]['name']);
        $this->assertGreaterThan(0, $dashboard['top_products'][0]['revenue']);
        $this->assertGreaterThan(0, $dashboard['top_products'][0]['units_sold']);
        $this->assertNotEmpty($dashboard['recent_activity']);
        $this->assertContains($dashboard['recent_activity'][0]['type'], [
            'order',
            'expense',
            'trust_transaction',
            'cooperative_financing',
            'cooperative_profit_cycle',
        ]);
        $this->assertNotEmpty($dashboard['recent_activity'][0]['action_path']);
        $this->assertContains(
            true,
            array_map(
                fn ($type) => in_array($type, ['cooperative_financing', 'cooperative_profit_cycle'], true),
                array_column($dashboard['recent_activity'], 'type')
            )
        );
        $this->assertContains(
            true,
            array_map(
                fn ($path) => in_array($path, ['/cooperative?section=financing', '/cooperative?section=profits'], true),
                array_column($dashboard['recent_activity'], 'action_path')
            )
        );
    }
}
