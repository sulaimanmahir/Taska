<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('commodity_name');
            $table->string('commodity_group')->nullable();
            $table->string('origin_region')->nullable();
            $table->string('quality_grade')->nullable();
            $table->decimal('moisture_percent', 8, 2)->default(0);
            $table->decimal('bag_count', 12, 3)->default(0);
            $table->decimal('weight_kg', 14, 3)->default(0);
            $table->decimal('cost_per_kg', 14, 2)->default(0);
            $table->decimal('selling_price_per_kg', 14, 2)->default(0);
            $table->decimal('shrinkage_allowance_percent', 8, 2)->default(0);
            $table->string('status')->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('commodity_price_boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('commodity_name');
            $table->string('market_name')->nullable();
            $table->decimal('buying_price_per_kg', 14, 2)->default(0);
            $table->decimal('selling_price_per_kg', 14, 2)->default(0);
            $table->date('effective_date');
            $table->string('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('commodity_trade_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('commodity_lot_id')->nullable()->constrained('commodity_lots')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ticket_type')->default('buy');
            $table->string('ticket_number')->unique();
            $table->string('commodity_name');
            $table->string('quality_grade')->nullable();
            $table->decimal('bag_count', 12, 3)->default(0);
            $table->decimal('weight_kg', 14, 3)->default(0);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->decimal('paid_amount', 14, 2)->default(0);
            $table->decimal('shrinkage_loss_kg', 14, 3)->default(0);
            $table->string('payment_status')->default('unpaid');
            $table->string('status')->default('open');
            $table->date('trade_date');
            $table->date('settlement_due_on')->nullable();
            $table->string('channel')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('commodity_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('commodity_trade_ticket_id')->constrained('commodity_trade_tickets')->cascadeOnDelete();
            $table->string('party_type')->default('supplier');
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('payment_method')->default('cash');
            $table->date('settled_on');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commodity_settlements');
        Schema::dropIfExists('commodity_trade_tickets');
        Schema::dropIfExists('commodity_price_boards');
        Schema::dropIfExists('commodity_lots');
    }
};
