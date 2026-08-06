<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PortfolioTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_portfolio_aggregates_stats_across_every_business_the_user_belongs_to(): void
    {
        $tenant = $this->createTenantContext('retail', 'portfolio-owner@example.com');
        $user = $tenant['user'];
        $businessOne = $tenant['business'];

        $businessTwo = Business::create([
            'name' => 'Second Business',
            'slug' => 'second-business-' . str()->random(4),
            'email' => 'second-' . str()->random(6) . '@example.com',
            'business_type' => 'restaurant',
            'modules' => [],
        ]);

        DB::table('business_user')->insert([
            'business_id' => $businessTwo->id,
            'user_id' => $user->id,
            'joined_at' => now(),
        ]);

        Order::create([
            'business_id' => $businessOne->id,
            'order_number' => 'ORD-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'discount' => 0,
            'tax' => 0,
            'total' => 1000,
            'paid' => 1000,
        ]);

        Order::create([
            'business_id' => $businessTwo->id,
            'order_number' => 'ORD-2',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 500,
            'discount' => 0,
            'tax' => 0,
            'total' => 500,
            'paid' => 500,
        ]);

        Customer::create(['business_id' => $businessOne->id, 'name' => 'Customer A', 'balance' => 0]);
        Customer::create(['business_id' => $businessTwo->id, 'name' => 'Customer B', 'balance' => 0]);
        Customer::create(['business_id' => $businessTwo->id, 'name' => 'Customer C', 'balance' => 0]);

        $expenseCategory = ExpenseCategory::create([
            'business_id' => $businessOne->id,
            'name' => 'Transport',
            'slug' => 'transport-' . str()->random(4),
        ]);

        Expense::create([
            'business_id' => $businessOne->id,
            'expense_category_id' => $expenseCategory->id,
            'description' => 'Fuel',
            'amount' => 200,
            'expense_date' => today(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/portfolio');

        $response->assertOk();
        $response->assertJsonCount(2, 'businesses');

        $businessOnePayload = collect($response->json('businesses'))->firstWhere('id', $businessOne->id);
        $businessTwoPayload = collect($response->json('businesses'))->firstWhere('id', $businessTwo->id);

        $this->assertEquals(1000.0, $businessOnePayload['stats']['today_sales']);
        $this->assertSame(1, $businessOnePayload['stats']['today_orders']);
        $this->assertSame(1, $businessOnePayload['stats']['customers_count']);
        $this->assertEquals(200.0, $businessOnePayload['stats']['expenses_today']);

        $this->assertEquals(500.0, $businessTwoPayload['stats']['today_sales']);
        $this->assertSame(1, $businessTwoPayload['stats']['today_orders']);
        $this->assertSame(2, $businessTwoPayload['stats']['customers_count']);
        $this->assertEquals(0.0, $businessTwoPayload['stats']['expenses_today']);

        $totals = $response->json('totals');
        $this->assertSame(2, $totals['business_count']);
        $this->assertEquals(1500.0, $totals['today_sales']);
        $this->assertSame(2, $totals['today_orders']);
        $this->assertSame(3, $totals['customers_count']);
        $this->assertEquals(200.0, $totals['expenses_today']);
    }

    public function test_portfolio_excludes_businesses_the_user_does_not_belong_to(): void
    {
        $tenant = $this->createTenantContext('retail', 'portfolio-owner-2@example.com');
        $other = $this->createTenantContext('retail', 'unrelated-owner@example.com');

        Order::create([
            'business_id' => $other['business']->id,
            'order_number' => 'ORD-OTHER',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'paid' => 5000,
        ]);

        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/portfolio');

        $response->assertOk();
        $response->assertJsonCount(1, 'businesses');
        $this->assertSame($tenant['business']->id, $response->json('businesses.0.id'));
        $this->assertEquals(0.0, $response->json('totals.today_sales'));
    }
}
