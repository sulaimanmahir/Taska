<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pure_water_retail_price_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('pricing_scope')->default('retail');
            $table->string('package_type')->default('bag');
            $table->decimal('minimum_quantity', 12, 3)->default(1);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('crate_deposit', 14, 2)->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('pure_water_retail_package_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('movement_type');
            $table->string('package_type')->default('bag');
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('units_per_package', 12, 3)->default(1);
            $table->decimal('unit_equivalent_quantity', 14, 3)->default(0);
            $table->string('sales_channel')->nullable();
            $table->foreignId('reference_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('pure_water_retail_crate_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('movement_type');
            $table->decimal('crate_count', 12, 3)->default(0);
            $table->decimal('deposit_amount', 14, 2)->default(0);
            $table->decimal('balance_after', 14, 3)->default(0);
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pure_water_retail_crate_ledgers');
        Schema::dropIfExists('pure_water_retail_package_movements');
        Schema::dropIfExists('pure_water_retail_price_tiers');
    }
};
