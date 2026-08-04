<?php

namespace Tests\Feature;

use App\Models\ConstructionQuotation;
use App\Models\ConstructionQuotationItem;
use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\Customer;
use App\Models\FuelVarianceAlert;
use App\Models\AgroSeasonalForecast;
use App\Models\HotelBooking;
use App\Models\HotelRoom;
use App\Models\InventoryItem;
use App\Models\LivestockAnimalGroup;
use App\Models\LivestockDiseaseLog;
use App\Models\LivestockMilkLog;
use App\Models\LivestockWeightLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductionBatch;
use App\Models\RestaurantTicket;
use App\Models\TrustAccount;
use App\Models\WholesaleRouteRun;
use App\Models\WholesaleRouteStop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AIInsightDecisionSupportTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_ai_engine_flags_reorder_window_and_debtor_followup_priority(): void
    {
        $tenant = $this->createTenantContext('retail', 'decision-retail@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Milo Refill Pack',
            'selling_price' => 1800,
            'cost_price' => 1300,
            'low_stock_alert' => 5,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 12,
            'reserved_quantity' => 0,
            'reorder_point' => 5,
            'reorder_quantity' => 24,
        ]);

        foreach (range(1, 7) as $index) {
            $order = Order::create([
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'order_number' => 'ORD-DECISION-' . $index,
                'order_type' => 'sale',
                'status' => 'completed',
                'subtotal' => 1800,
                'discount' => 0,
                'tax' => 0,
                'total' => 1800,
                'paid' => 1800,
                'change' => 0,
                'payment_method' => 'cash',
            ]);

            DB::table('order_items')->insert([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => null,
                'quantity' => 1,
                'unit_price' => 1800,
                'discount' => 0,
                'total' => 1800,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Prime Estate Project',
            'phone' => '08039990000',
            'customer_type' => 'wholesaler',
            'credit_limit' => 150000,
            'balance' => 88000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 150000,
            'balance' => 88000,
            'total_repaid' => 10000,
            'last_payment_date' => now()->subDays(16),
            'status' => 'active',
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('reorder_window_forecast', $types);
        $this->assertContains('debtor_followup_priority', $types);
    }

    public function test_ai_engine_flags_adashe_collection_slippage(): void
    {
        $tenant = $this->createTenantContext('general', 'decision-adashe@example.com');

        Sanctum::actingAs($tenant['user']);

        $member = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Maryam Adashe',
            'phone' => '08035556666',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 32000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $member->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Market Women Pot',
            'limit' => 80000,
            'installment_amount' => 5000,
            'contribution_frequency_days' => 7,
            'balance' => 32000,
            'total_repaid' => 0,
            'last_payment_date' => now()->subDays(10),
            'next_due_date' => now()->subDay(),
            'status' => 'active',
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('adashe_collection_slippage', $types);
    }

    public function test_ai_engine_flags_adashe_due_collection_pressure(): void
    {
        $tenant = $this->createTenantContext('general', 'decision-adashe-due@example.com');

        Sanctum::actingAs($tenant['user']);

        $member = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Aisha Collection',
            'phone' => '08036661111',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 18000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $member->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Monday Savings Circle',
            'limit' => 60000,
            'installment_amount' => 5000,
            'contribution_frequency_days' => 7,
            'balance' => 18000,
            'total_repaid' => 0,
            'last_payment_date' => now()->subDays(8),
            'next_due_date' => now()->subDay(),
            'status' => 'active',
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('adashe_due_collection_pressure', $types);
    }

    public function test_ai_engine_flags_cooperative_financing_approval_drag(): void
    {
        $tenant = $this->createTenantContext('general', 'decision-cooperative-approval@example.com');

        Sanctum::actingAs($tenant['user']);

        $cooperative = Cooperative::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Approval Drag Cooperative',
            'slug' => 'approval-drag-coop',
            'share_price' => 1000,
            'minimum_member_shares' => 1,
            'profit_cycle' => 'monthly',
            'status' => 'active',
        ]);

        $memberCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Usman Member',
            'phone' => '08037771111',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $member = CooperativeMember::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'customer_id' => $memberCustomer->id,
            'member_number' => 'COOP-001',
            'role' => 'member',
            'joined_at' => now()->subMonths(2)->toDateString(),
            'status' => 'active',
        ]);

        $financing = CooperativeFinancing::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'member_id' => $member->id,
            'financing_type' => 'qard_hasan',
            'status' => 'pending_admin_approval',
            'amount_requested' => 12000,
            'submitted_at' => now()->subDays(3),
        ]);

        $financing->forceFill([
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ])->saveQuietly();

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('cooperative_financing_approval_drag', $types);
    }

    public function test_ai_engine_flags_cooperative_profit_distribution_readiness(): void
    {
        $tenant = $this->createTenantContext('general', 'decision-cooperative-profit@example.com');

        Sanctum::actingAs($tenant['user']);

        $cooperative = Cooperative::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Profit Readiness Cooperative',
            'slug' => 'profit-ready-coop',
            'share_price' => 1000,
            'minimum_member_shares' => 1,
            'profit_cycle' => 'monthly',
            'status' => 'active',
        ]);

        CooperativeProfitCycle::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'label' => 'Shawwal Distribution Cycle',
            'cycle_start' => now()->subMonth()->startOfMonth()->toDateString(),
            'cycle_end' => now()->subMonth()->endOfMonth()->toDateString(),
            'total_profit' => 30000,
            'distributable_profit' => 22000,
            'reserve_allocation' => 5000,
            'charity_allocation' => 3000,
            'status' => 'approved',
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('cooperative_profit_distribution_readiness', $types);
    }

    public function test_ai_engine_flags_hotel_occupancy_pacing(): void
    {
        $tenant = $this->createTenantContext('hotel', 'decision-hotel@example.com');

        Sanctum::actingAs($tenant['user']);

        $roomOne = HotelRoom::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_number' => '101',
            'category' => 'Deluxe',
            'floor' => '1',
            'status' => 'available',
            'cleaning_status' => 'clean',
            'base_rate' => 55000,
            'is_active' => true,
        ]);

        $roomTwo = HotelRoom::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_number' => '102',
            'category' => 'Deluxe',
            'floor' => '1',
            'status' => 'available',
            'cleaning_status' => 'clean',
            'base_rate' => 55000,
            'is_active' => true,
        ]);

        HotelBooking::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_id' => $roomOne->id,
            'reservation_code' => 'HTL-001',
            'guest_name' => 'Ada Obi',
            'guest_phone' => '08031111111',
            'status' => 'checked_out',
            'check_in_date' => now()->subDays(3)->toDateString(),
            'check_out_date' => now()->subDays(2)->toDateString(),
            'adults' => 2,
            'payment_method' => 'cash',
            'room_rate' => 55000,
            'total_amount' => 55000,
            'amount_paid' => 55000,
        ]);

        HotelBooking::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_id' => $roomTwo->id,
            'reservation_code' => 'HTL-002',
            'guest_name' => 'Bola James',
            'guest_phone' => '08032222222',
            'status' => 'checked_out',
            'check_in_date' => now()->subDays(2)->toDateString(),
            'check_out_date' => now()->subDay()->toDateString(),
            'adults' => 2,
            'payment_method' => 'transfer',
            'room_rate' => 55000,
            'total_amount' => 55000,
            'amount_paid' => 55000,
        ]);

        HotelBooking::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_id' => $roomOne->id,
            'reservation_code' => 'HTL-003',
            'guest_name' => 'Chika Nwosu',
            'guest_phone' => '08033333333',
            'status' => 'reserved',
            'check_in_date' => now()->addDay()->toDateString(),
            'check_out_date' => now()->addDays(2)->toDateString(),
            'adults' => 2,
            'payment_method' => 'transfer',
            'room_rate' => 55000,
            'total_amount' => 55000,
            'amount_paid' => 20000,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('hotel_occupancy_pacing', $types);
    }

    public function test_ai_engine_flags_production_cost_spike_forecast(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'decision-factory@example.com');

        Sanctum::actingAs($tenant['user']);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-COST-001',
            'production_date' => now()->subDays(4)->toDateString(),
            'status' => 'completed',
            'total_output_quantity' => 1000,
            'electricity_cost' => 12000,
            'generator_fuel_cost' => 18000,
            'packaging_cost_total' => 70000,
            'total_batch_cost' => 150000,
            'estimated_revenue' => 210000,
            'net_margin' => 60000,
        ]);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-COST-002',
            'production_date' => now()->subDays(3)->toDateString(),
            'status' => 'completed',
            'total_output_quantity' => 1000,
            'electricity_cost' => 13000,
            'generator_fuel_cost' => 17000,
            'packaging_cost_total' => 72000,
            'total_batch_cost' => 152000,
            'estimated_revenue' => 212000,
            'net_margin' => 60000,
        ]);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-COST-003',
            'production_date' => now()->subDays(2)->toDateString(),
            'status' => 'completed',
            'total_output_quantity' => 1000,
            'electricity_cost' => 13500,
            'generator_fuel_cost' => 17500,
            'packaging_cost_total' => 73000,
            'total_batch_cost' => 154000,
            'estimated_revenue' => 214000,
            'net_margin' => 60000,
        ]);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-COST-004',
            'production_date' => now()->subDay()->toDateString(),
            'status' => 'completed',
            'total_output_quantity' => 1000,
            'electricity_cost' => 22000,
            'generator_fuel_cost' => 28000,
            'packaging_cost_total' => 98000,
            'total_batch_cost' => 220000,
            'estimated_revenue' => 245000,
            'net_margin' => 25000,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('production_cost_spike_forecast', $types);
    }

    public function test_ai_engine_flags_pharmacy_demand_forecast(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'decision-pharmacy@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Paracetamol Suspension',
            'selling_price' => 3200,
            'cost_price' => 2200,
            'low_stock_alert' => 6,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'PARA-OLD',
            'manufacture_date' => now()->subMonths(10),
            'expiry_date' => now()->addDays(15),
            'quantity' => 25,
            'remaining_quantity' => 25,
            'cost_per_unit' => 2200,
        ]);

        ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'PARA-SAFE',
            'manufacture_date' => now()->subMonths(2),
            'expiry_date' => now()->addDays(90),
            'quantity' => 10,
            'remaining_quantity' => 10,
            'cost_per_unit' => 2200,
        ]);

        foreach (range(1, 14) as $index) {
            $order = Order::create([
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'order_number' => 'ORD-PHARMA-' . $index,
                'order_type' => 'sale',
                'status' => 'completed',
                'subtotal' => 3200,
                'discount' => 0,
                'tax' => 0,
                'total' => 3200,
                'paid' => 3200,
                'change' => 0,
                'payment_method' => 'cash',
                'created_at' => now()->subDays($index),
                'updated_at' => now()->subDays($index),
            ]);

            DB::table('order_items')->insert([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => null,
                'quantity' => 1,
                'unit_price' => 3200,
                'discount' => 0,
                'total' => 3200,
                'created_at' => now()->subDays($index),
                'updated_at' => now()->subDays($index),
            ]);
        }

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('pharmacy_demand_forecast', $types);
    }

    public function test_ai_engine_flags_fuel_shrinkage_risk_score(): void
    {
        $tenant = $this->createTenantContext('fuel_business', 'decision-fuel@example.com');

        Sanctum::actingAs($tenant['user']);

        FuelVarianceAlert::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'alert_type' => 'wet_stock_variance',
            'severity' => 'critical',
            'metric_value' => 55,
            'threshold_value' => 20,
            'details' => 'Tank dip variance above threshold.',
            'detected_at' => now()->subDay(),
            'is_resolved' => false,
        ]);

        FuelVarianceAlert::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'alert_type' => 'shift_shortage',
            'severity' => 'warning',
            'metric_value' => 18,
            'threshold_value' => 10,
            'details' => 'Cash shortage recurring on same shift.',
            'detected_at' => now()->subHours(12),
            'is_resolved' => false,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('fuel_shrinkage_risk_score', $types);
    }

    public function test_ai_engine_flags_school_fee_default_warning(): void
    {
        $tenant = $this->createTenantContext('school', 'decision-school@example.com');

        Sanctum::actingAs($tenant['user']);

        $sessionId = $this->postJson('/api/school/sessions', [
            'name' => '2026/2027',
            'starts_on' => '2026-09-01',
            'ends_on' => '2027-07-30',
            'is_active' => true,
        ])->assertCreated()->json('id');

        $termId = $this->postJson('/api/school/terms', [
            'academic_session_id' => $sessionId,
            'name' => 'First Term',
            'starts_on' => '2026-09-01',
            'ends_on' => '2026-12-15',
            'is_active' => true,
        ])->assertCreated()->json('id');

        $classroomId = $this->postJson('/api/school/classes', [
            'branch_id' => $tenant['branch']->id,
            'name' => 'SS 1',
            'stream' => 'Blue',
            'department' => 'Senior School',
            'capacity' => 40,
        ])->assertCreated()->json('id');

        $studentId = $this->postJson('/api/school/students', [
            'branch_id' => $tenant['branch']->id,
            'full_name' => 'Maryam Yusuf',
            'gender' => 'Female',
            'phone' => '08034445555',
            'admitted_on' => now()->toDateString(),
            'guardian' => [
                'full_name' => 'Yusuf Danjuma',
                'relationship' => 'Father',
                'phone' => '08037778888',
            ],
        ])->assertCreated()->json('id');

        $this->postJson('/api/school/enrollments', [
            'student_id' => $studentId,
            'academic_session_id' => $sessionId,
            'academic_term_id' => $termId,
            'school_classroom_id' => $classroomId,
        ])->assertCreated();

        $feeStructureId = $this->postJson('/api/school/fee-structures', [
            'academic_session_id' => $sessionId,
            'academic_term_id' => $termId,
            'school_classroom_id' => $classroomId,
            'name' => 'Tuition',
            'amount' => 80000,
            'discount_amount' => 0,
            'scholarship_amount' => 0,
        ])->assertCreated()->json('id');

        $this->postJson('/api/school/fee-payments', [
            'student_id' => $studentId,
            'school_fee_structure_id' => $feeStructureId,
            'amount_paid' => 20000,
            'payment_method' => 'cash',
        ])->assertCreated();

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('school_fee_default_warning', $types);
    }

    public function test_ai_engine_flags_construction_margin_pressure(): void
    {
        $tenant = $this->createTenantContext('construction', 'decision-construction@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Prime Site Buyer',
            'phone' => '08036667777',
            'customer_type' => 'wholesaler',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Dangote Cement 50kg',
            'cost_price' => 7200,
            'selling_price' => 8200,
            'is_active' => true,
        ]);

        $quotation = ConstructionQuotation::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'quotation_number' => 'QT-AI-001',
            'status' => 'draft',
            'valid_until' => now()->addDays(7)->toDateString(),
            'delivery_fee' => 20000,
            'discount_amount' => 0,
            'subtotal' => 730000,
            'total' => 750000,
        ]);

        ConstructionQuotationItem::create([
            'quotation_id' => $quotation->id,
            'product_id' => $product->id,
            'item_name' => 'Dangote Cement 50kg',
            'unit_type' => 'bag',
            'quantity' => 100,
            'converted_quantity' => 100,
            'unit_price' => 7420,
            'discount_amount' => 0,
            'line_total' => 742000,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('construction_margin_pressure', $types);
    }

    public function test_ai_engine_flags_wholesale_route_profitability_forecast(): void
    {
        $tenant = $this->createTenantContext('wholesale', 'decision-wholesale@example.com');

        Sanctum::actingAs($tenant['user']);

        $routeRun = WholesaleRouteRun::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'route_name' => 'Tuesday Market Loop',
            'status' => 'completed',
            'route_date' => now()->toDateString(),
            'target_amount' => 200000,
            'actual_amount' => 120000,
        ]);

        WholesaleRouteStop::create([
            'route_run_id' => $routeRun->id,
            'stop_name' => 'Main Market Stop',
            'status' => 'completed',
            'expected_amount' => 90000,
            'collected_amount' => 50000,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('wholesale_route_profitability_forecast', $types);
    }

    public function test_ai_engine_flags_agro_seasonal_stock_planning(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'decision-agro@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Hybrid Maize Seed',
            'selling_price' => 25000,
            'cost_price' => 18000,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 40,
        ]);

        AgroSeasonalForecast::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'product_id' => $product->id,
            'season_name' => 'Wet Season 2026',
            'region_name' => 'Kaduna North',
            'forecast_quantity' => 160,
            'reserved_quantity' => 20,
            'confidence_score' => 88,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('agro_seasonal_stock_planning', $types);
    }

    public function test_ai_engine_flags_livestock_health_productivity_warning(): void
    {
        $tenant = $this->createTenantContext('livestock', 'decision-livestock@example.com');

        Sanctum::actingAs($tenant['user']);

        $group = LivestockAnimalGroup::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Dairy Herd A',
            'species' => 'Cattle',
            'breed' => 'Friesian',
            'animal_count' => 20,
            'average_weight_kg' => 240,
            'status' => 'active',
        ]);

        LivestockMilkLog::create([
            'business_id' => $tenant['business']->id,
            'animal_group_id' => $group->id,
            'litres' => 100,
            'recorded_on' => now()->subDay()->toDateString(),
        ]);

        LivestockMilkLog::create([
            'business_id' => $tenant['business']->id,
            'animal_group_id' => $group->id,
            'litres' => 80,
            'recorded_on' => now()->toDateString(),
        ]);

        LivestockWeightLog::create([
            'business_id' => $tenant['business']->id,
            'animal_group_id' => $group->id,
            'weight_kg' => 250,
            'sample_size' => 4,
            'weighed_at' => now()->subDays(2),
        ]);

        LivestockWeightLog::create([
            'business_id' => $tenant['business']->id,
            'animal_group_id' => $group->id,
            'weight_kg' => 228,
            'sample_size' => 4,
            'weighed_at' => now(),
        ]);

        LivestockDiseaseLog::create([
            'business_id' => $tenant['business']->id,
            'animal_group_id' => $group->id,
            'disease_name' => 'Mastitis',
            'severity' => 'high',
            'affected_count' => 3,
            'recorded_on' => now()->toDateString(),
            'status' => 'open',
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('livestock_health_productivity_warning', $types);
    }

    public function test_ai_engine_flags_restaurant_margin_waste_forecast(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'decision-restaurant@example.com');

        Sanctum::actingAs($tenant['user']);

        RestaurantTicket::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'ticket_number' => 'RST-AI-001',
            'order_channel' => 'dine_in',
            'service_status' => 'closed',
            'payment_status' => 'paid',
            'guest_name' => 'Ada Guest',
            'split_count' => 1,
            'subtotal' => 10000,
            'service_charge' => 500,
            'delivery_fee' => 0,
            'total' => 10500,
            'amount_paid' => 10500,
            'recipe_cost_total' => 5200,
            'gross_margin' => 3000,
            'waste_cost_total' => 1200,
            'opened_at' => now()->subHours(2),
            'closed_at' => now()->subHour(),
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('restaurant_margin_waste_forecast', $types);
    }
}
