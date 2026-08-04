<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('zone')->nullable();
            $table->unsignedInteger('seats')->default(2);
            $table->string('status')->default('available');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('restaurant_waiter_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('staff_name');
            $table->string('shift_code')->unique();
            $table->string('status')->default('open');
            $table->unsignedInteger('orders_handled')->default(0);
            $table->decimal('cash_variance', 14, 2)->default(0);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('recipe_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('yield_quantity', 12, 3)->default(1);
            $table->string('prep_station')->nullable();
            $table->decimal('estimated_cost', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_card_id')->constrained('recipe_cards')->cascadeOnDelete();
            $table->foreignId('ingredient_product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3)->default(1);
            $table->decimal('unit_cost', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('restaurant_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('waiter_shift_id')->nullable()->constrained('restaurant_waiter_shifts')->nullOnDelete();
            $table->string('ticket_number')->unique();
            $table->string('order_channel')->default('dine_in');
            $table->string('service_status')->default('open');
            $table->string('payment_status')->default('unpaid');
            $table->string('guest_name')->nullable();
            $table->text('delivery_address')->nullable();
            $table->unsignedInteger('split_count')->default(1);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('service_charge', 14, 2)->default(0);
            $table->decimal('delivery_fee', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->decimal('recipe_cost_total', 14, 2)->default(0);
            $table->decimal('gross_margin', 14, 2)->default(0);
            $table->decimal('waste_cost_total', 14, 2)->default(0);
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('restaurant_ticket_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_ticket_id')->constrained('restaurant_tickets')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('course_name')->nullable();
            $table->decimal('quantity', 12, 3)->default(1);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('recipe_cost', 14, 2)->default(0);
            $table->string('service_status')->default('queued');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('kitchen_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_ticket_id')->constrained('restaurant_tickets')->cascadeOnDelete();
            $table->string('status')->default('queued');
            $table->string('priority')->default('normal');
            $table->string('station')->nullable();
            $table->timestamp('fired_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('table_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->string('guest_name');
            $table->string('guest_phone')->nullable();
            $table->timestamp('reservation_for');
            $table->unsignedInteger('party_size')->default(2);
            $table->string('status')->default('reserved');
            $table->string('occasion')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('food_waste_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('recipe_card_id')->nullable()->constrained('recipe_cards')->nullOnDelete();
            $table->decimal('quantity', 12, 3)->default(1);
            $table->decimal('cost_impact', 14, 2)->default(0);
            $table->string('waste_type')->default('kitchen_loss');
            $table->timestamp('logged_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_waste_logs');
        Schema::dropIfExists('table_reservations');
        Schema::dropIfExists('kitchen_tickets');
        Schema::dropIfExists('restaurant_ticket_items');
        Schema::dropIfExists('restaurant_tickets');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipe_cards');
        Schema::dropIfExists('restaurant_waiter_shifts');
        Schema::dropIfExists('restaurant_tables');
    }
};
