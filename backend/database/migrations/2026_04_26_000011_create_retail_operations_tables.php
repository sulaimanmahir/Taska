<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retail_cashier_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('opened_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('shift_code')->unique();
            $table->string('status')->default('open');
            $table->decimal('opening_float', 15, 2)->default(0);
            $table->decimal('cash_sales_total', 15, 2)->default(0);
            $table->decimal('petty_cash_total', 15, 2)->default(0);
            $table->decimal('refund_total', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('actual_cash', 15, 2)->nullable();
            $table->decimal('variance_amount', 15, 2)->default(0);
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('retail_loyalty_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->string('phone');
            $table->string('tier')->default('standard');
            $table->decimal('points_balance', 15, 2)->default(0);
            $table->decimal('lifetime_spend', 15, 2)->default(0);
            $table->timestamp('last_purchase_at')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'phone']);
        });

        Schema::create('retail_petty_cash_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('shift_id')->nullable()->constrained('retail_cashier_shifts')->onDelete('set null');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('entry_type');
            $table->string('category');
            $table->decimal('amount', 15, 2);
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });

        Schema::create('retail_order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('payment_method');
            $table->decimal('amount', 15, 2);
            $table->string('reference')->nullable();
            $table->timestamps();
        });

        Schema::create('retail_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('refund_number')->unique();
            $table->string('status')->default('completed');
            $table->decimal('refund_amount', 15, 2);
            $table->string('payment_method')->default('cash');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('refunded_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retail_refunds');
        Schema::dropIfExists('retail_order_payments');
        Schema::dropIfExists('retail_petty_cash_entries');
        Schema::dropIfExists('retail_loyalty_profiles');
        Schema::dropIfExists('retail_cashier_shifts');
    }
};
