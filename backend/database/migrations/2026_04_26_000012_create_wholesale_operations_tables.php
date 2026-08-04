<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_sales_reps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('status')->default('active');
            $table->string('territory')->nullable();
            $table->decimal('target_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('wholesale_price_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('tier_name');
            $table->decimal('minimum_quantity', 15, 3)->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_percent', 8, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('wholesale_route_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('sales_rep_id')->nullable()->constrained('wholesale_sales_reps')->onDelete('set null');
            $table->string('route_name');
            $table->string('status')->default('planned');
            $table->date('route_date');
            $table->string('vehicle_reference')->nullable();
            $table->decimal('target_amount', 15, 2)->default(0);
            $table->decimal('actual_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('wholesale_route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_run_id')->constrained('wholesale_route_runs')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->string('stop_name');
            $table->string('status')->default('planned');
            $table->decimal('expected_amount', 15, 2)->default(0);
            $table->decimal('collected_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('wholesale_stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('to_warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->onDelete('set null');
            $table->decimal('quantity', 15, 3);
            $table->string('status')->default('completed');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_stock_transfers');
        Schema::dropIfExists('wholesale_route_stops');
        Schema::dropIfExists('wholesale_route_runs');
        Schema::dropIfExists('wholesale_price_tiers');
        Schema::dropIfExists('wholesale_sales_reps');
    }
};
