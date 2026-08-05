<?php

namespace Tests\Feature;

use App\Models\KitchenTicket;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\RestaurantTicket;
use App\Models\RestaurantTicketItem;
use App\Models\RestaurantWaiterShift;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class RestaurantWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_restaurant_business_can_progress_kitchen_status_and_close_ticket(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'restaurant-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $table = RestaurantTable::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Table 4',
            'zone' => 'Patio',
            'seats' => 4,
            'status' => 'occupied',
        ]);

        $shift = RestaurantWaiterShift::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'staff_name' => 'Halima Bala',
            'shift_code' => 'WTR-001',
            'status' => 'open',
            'orders_handled' => 1,
            'started_at' => now()->subHour(),
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Jollof Rice',
            'sku' => 'RST-JOLLOF-1',
            'product_type' => 'finished_good',
            'cost_price' => 1800,
            'selling_price' => 3500,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $ticket = RestaurantTicket::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'table_id' => $table->id,
            'waiter_shift_id' => $shift->id,
            'ticket_number' => 'RST-001',
            'order_channel' => 'dine_in',
            'service_status' => 'open',
            'payment_status' => 'unpaid',
            'guest_name' => 'Musa Family',
            'split_count' => 1,
            'subtotal' => 7000,
            'service_charge' => 500,
            'delivery_fee' => 0,
            'total' => 7500,
            'amount_paid' => 0,
            'recipe_cost_total' => 3600,
            'gross_margin' => 3900,
            'waste_cost_total' => 0,
            'opened_at' => now()->subMinutes(20),
        ]);

        RestaurantTicketItem::create([
            'business_id' => $tenant['business']->id,
            'restaurant_ticket_id' => $ticket->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 3500,
            'recipe_cost' => 1800,
            'service_status' => 'queued',
        ]);

        KitchenTicket::create([
            'business_id' => $tenant['business']->id,
            'restaurant_ticket_id' => $ticket->id,
            'status' => 'queued',
            'priority' => 'normal',
            'station' => 'hot-kitchen',
        ]);

        $this->postJson("/api/restaurant/tickets/{$ticket->id}/kitchen-status", [
            'status' => 'ready',
            'station' => 'pass',
            'notes' => 'Plate for pickup',
        ])->assertOk()
            ->assertJsonPath('service_status', 'ready')
            ->assertJsonPath('kitchen_ticket.status', 'ready')
            ->assertJsonPath('kitchen_ticket.station', 'pass')
            ->assertJsonPath('items.0.service_status', 'ready');

        $this->postJson("/api/restaurant/tickets/{$ticket->id}/close", [
            'amount_paid' => 7500,
            'waste_cost_total' => 300,
        ])->assertOk()
            ->assertJsonPath('service_status', 'closed')
            ->assertJsonPath('payment_status', 'paid')
            ->assertJsonPath('amount_paid', '7500.00')
            ->assertJsonPath('waste_cost_total', '300.00')
            ->assertJsonPath('gross_margin', '3600.00')
            ->assertJsonPath('table.status', 'available')
            ->assertJsonPath('kitchen_ticket.status', 'served');
    }

    public function test_restaurant_ticket_state_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('restaurant', 'restaurant-primary@example.com');
        $otherTenant = $this->createTenantContext('restaurant', 'restaurant-secondary@example.com');

        $ticket = RestaurantTicket::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'ticket_number' => 'RST-002',
            'order_channel' => 'takeaway',
            'service_status' => 'open',
            'payment_status' => 'unpaid',
            'split_count' => 1,
            'subtotal' => 2500,
            'service_charge' => 0,
            'delivery_fee' => 0,
            'total' => 2500,
            'amount_paid' => 0,
            'recipe_cost_total' => 900,
            'gross_margin' => 1600,
            'waste_cost_total' => 0,
            'opened_at' => now(),
        ]);

        KitchenTicket::create([
            'business_id' => $tenant['business']->id,
            'restaurant_ticket_id' => $ticket->id,
            'status' => 'queued',
            'priority' => 'urgent',
            'station' => 'grill',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/restaurant/tickets/{$ticket->id}/kitchen-status", [
            'status' => 'served',
        ])->assertForbidden();

        $this->postJson("/api/restaurant/tickets/{$ticket->id}/close", [
            'amount_paid' => 2500,
        ])->assertForbidden();
    }
}
