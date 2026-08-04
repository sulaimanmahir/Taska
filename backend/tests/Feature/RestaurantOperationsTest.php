<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\RecipeCard;
use App\Models\RestaurantTable;
use App\Models\RestaurantWaiterShift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class RestaurantOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_restaurant_can_run_tables_recipes_kitchen_and_waste_controls(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'restaurant-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $menu = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Jollof Rice Plate',
            'selling_price' => 4500,
            'cost_price' => 1800,
            'track_inventory' => false,
            'is_active' => true,
        ]);

        $ingredient = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Rice Base',
            'selling_price' => 0,
            'cost_price' => 1200,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $tableId = $this->postJson('/api/restaurant/tables', [
            'branch_id' => $tenant['branch']->id,
            'name' => 'Table 1',
            'zone' => 'Main Hall',
            'seats' => 4,
        ])->assertCreated()->json('id');

        $shiftId = $this->postJson('/api/restaurant/shifts', [
            'branch_id' => $tenant['branch']->id,
            'staff_name' => 'Kemi Waiter',
            'started_at' => now()->toDateTimeString(),
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->json('id');

        $recipeId = $this->postJson('/api/restaurant/recipes', [
            'product_id' => $menu->id,
            'yield_quantity' => 1,
            'prep_station' => 'rice-line',
            'ingredients' => [
                [
                    'ingredient_product_id' => $ingredient->id,
                    'quantity' => 1,
                    'unit_cost' => 1250,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('estimated_cost', '1250.00')
            ->json('id');

        $this->postJson('/api/restaurant/reservations', [
            'branch_id' => $tenant['branch']->id,
            'table_id' => $tableId,
            'guest_name' => 'Amaka Obi',
            'guest_phone' => '08030000000',
            'reservation_for' => now()->addHour()->toDateTimeString(),
            'party_size' => 3,
            'occasion' => 'Birthday',
        ])->assertCreated()
            ->assertJsonPath('status', 'reserved');

        $ticketId = $this->postJson('/api/restaurant/tickets', [
            'branch_id' => $tenant['branch']->id,
            'table_id' => $tableId,
            'waiter_shift_id' => $shiftId,
            'guest_name' => 'Amaka Obi',
            'order_channel' => 'dine_in',
            'split_count' => 2,
            'service_charge' => 500,
            'items' => [
                [
                    'product_id' => $menu->id,
                    'quantity' => 2,
                    'unit_price' => 4500,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('table.status', 'occupied')
            ->assertJsonPath('subtotal', '9000.00')
            ->assertJsonPath('gross_margin', '7000.00')
            ->json('id');

        $this->postJson("/api/restaurant/tickets/{$ticketId}/kitchen-status", [
            'status' => 'preparing',
            'station' => 'hot-kitchen',
        ])->assertOk()
            ->assertJsonPath('service_status', 'preparing');

        $this->postJson("/api/restaurant/tickets/{$ticketId}/kitchen-status", [
            'status' => 'ready',
        ])->assertOk()
            ->assertJsonPath('service_status', 'ready');

        $this->postJson('/api/restaurant/waste-logs', [
            'branch_id' => $tenant['branch']->id,
            'product_id' => $menu->id,
            'recipe_card_id' => $recipeId,
            'quantity' => 0.5,
            'cost_impact' => 350,
            'waste_type' => 'plate_return',
            'notes' => 'Customer returned half portion.',
        ])->assertCreated()
            ->assertJsonPath('waste_type', 'plate_return');

        $this->postJson("/api/restaurant/tickets/{$ticketId}/close", [
            'amount_paid' => 9500,
            'waste_cost_total' => 350,
        ])->assertOk()
            ->assertJsonPath('service_status', 'closed')
            ->assertJsonPath('payment_status', 'paid')
            ->assertJsonPath('table.status', 'available')
            ->assertJsonPath('gross_margin', '6650.00');

        $this->getJson('/api/restaurant/overview')
            ->assertOk()
            ->assertJsonPath('summary.revenue_today', 9500)
            ->assertJsonPath('summary.waste_cost_today', 350)
            ->assertJsonPath('summary.open_waiter_shifts', 1);
    }

    public function test_restaurant_endpoints_reject_foreign_tenant_relations_and_waiters(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'restaurant-scope@example.com');
        $otherTenant = $this->createTenantContext('restaurant', 'restaurant-other@example.com');

        $foreignWaiter = User::factory()->create([
            'email' => 'foreign-waiter@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignWaiter, $otherTenant['business']->id);

        $foreignMenu = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Menu',
            'selling_price' => 5000,
            'cost_price' => 2000,
            'track_inventory' => false,
            'is_active' => true,
        ]);

        $foreignIngredient = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Ingredient',
            'selling_price' => 0,
            'cost_price' => 1000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $foreignTable = RestaurantTable::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Table',
            'status' => 'available',
        ]);

        $foreignShift = RestaurantWaiterShift::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignWaiter->id,
            'staff_name' => 'Foreign Waiter',
            'shift_code' => 'WTR-FOREIGN-001',
            'status' => 'open',
            'started_at' => now(),
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Diner',
            'phone' => '08030009994',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $foreignRecipe = RecipeCard::create([
            'business_id' => $otherTenant['business']->id,
            'product_id' => $foreignMenu->id,
            'yield_quantity' => 1,
            'estimated_cost' => 1200,
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/restaurant/tables', [
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Invalid Table',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->postJson('/api/restaurant/shifts', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignWaiter->id,
            'staff_name' => 'Invalid Waiter',
            'started_at' => now()->toDateTimeString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id']);

        $this->postJson('/api/restaurant/recipes', [
            'product_id' => $foreignMenu->id,
            'ingredients' => [[
                'ingredient_product_id' => $foreignIngredient->id,
                'quantity' => 1,
                'unit_cost' => 1000,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'ingredients.0.ingredient_product_id']);

        $this->postJson('/api/restaurant/reservations', [
            'branch_id' => $otherTenant['branch']->id,
            'table_id' => $foreignTable->id,
            'guest_name' => 'Invalid Reservation',
            'reservation_for' => now()->addHour()->toDateTimeString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'table_id']);

        $this->postJson('/api/restaurant/tickets', [
            'branch_id' => $otherTenant['branch']->id,
            'table_id' => $foreignTable->id,
            'customer_id' => $foreignCustomer->id,
            'waiter_shift_id' => $foreignShift->id,
            'items' => [[
                'product_id' => $foreignMenu->id,
                'quantity' => 1,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'branch_id',
                'table_id',
                'customer_id',
                'waiter_shift_id',
                'items.0.product_id',
            ]);

        $this->postJson('/api/restaurant/waste-logs', [
            'branch_id' => $otherTenant['branch']->id,
            'product_id' => $foreignMenu->id,
            'recipe_card_id' => $foreignRecipe->id,
            'quantity' => 1,
            'cost_impact' => 200,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'product_id', 'recipe_card_id']);
    }

    private function attachActiveMember(User $user, int $businessId): void
    {
        DB::table('business_user')->insert([
            'business_id' => $businessId,
            'user_id' => $user->id,
            'role_id' => null,
            'branch_id' => null,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);
    }
}
