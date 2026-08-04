<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('construction_product_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('subcategory')->nullable();
            $table->string('brand')->nullable();
            $table->string('unit_type')->default('piece');
            $table->decimal('wholesale_price', 15, 2)->nullable();
            $table->decimal('contractor_price', 15, 2)->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('stock_location_type')->default('warehouse');
            $table->decimal('weight_kg', 15, 3)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('scarcity_pricing_allowed')->default(false);
            $table->timestamps();

            $table->unique(['business_id', 'product_id']);
        });

        Schema::create('construction_customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('customer_role')->default('walk_in_customer');
            $table->string('site_location')->nullable();
            $table->string('project_name')->nullable();
            $table->string('pricing_tier')->default('retail');
            $table->text('guarantor_notes')->nullable();
            $table->boolean('is_blocked_defaulter')->default(false);
            $table->timestamps();

            $table->unique(['business_id', 'customer_id']);
        });

        Schema::create('construction_quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('quotation_number');
            $table->string('status')->default('draft');
            $table->date('valid_until')->nullable();
            $table->decimal('delivery_fee', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('converted_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['business_id', 'quotation_number']);
        });

        Schema::create('construction_quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained('construction_quotations')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_name');
            $table->string('unit_type')->default('piece');
            $table->decimal('quantity', 15, 3)->default(0);
            $table->decimal('converted_quantity', 15, 3)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('construction_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained('construction_quotations')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('delivery_mode')->default('delivery_to_site');
            $table->string('destination_type')->default('site');
            $table->string('driver_name')->nullable();
            $table->string('loader_name')->nullable();
            $table->string('vehicle_reference')->nullable();
            $table->string('status')->default('pending_dispatch');
            $table->string('failure_reason')->nullable();
            $table->text('delivery_address')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('confirmed_by')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('construction_credit_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('outstanding_amount', 15, 2)->default(0);
            $table->text('installment_notes')->nullable();
            $table->string('debt_age_bucket')->default('current');
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('construction_credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_account_id')->constrained('construction_credit_accounts')->onDelete('cascade');
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('payment_date');
            $table->string('payment_method')->default('cash');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('construction_price_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('price_type')->default('selling');
            $table->decimal('previous_price', 15, 2)->default(0);
            $table->decimal('new_price', 15, 2)->default(0);
            $table->string('reason')->nullable();
            $table->date('effective_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('construction_stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('source_warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('destination_warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('unit_of_measure_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
            $table->decimal('quantity', 15, 3)->default(0);
            $table->decimal('converted_quantity', 15, 3)->default(0);
            $table->string('status')->default('completed');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('construction_stock_transfers');
        Schema::dropIfExists('construction_price_changes');
        Schema::dropIfExists('construction_credit_payments');
        Schema::dropIfExists('construction_credit_accounts');
        Schema::dropIfExists('construction_deliveries');
        Schema::dropIfExists('construction_quotation_items');
        Schema::dropIfExists('construction_quotations');
        Schema::dropIfExists('construction_customer_profiles');
        Schema::dropIfExists('construction_product_profiles');
    }
};
