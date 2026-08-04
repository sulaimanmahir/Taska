<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('textile_customer_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('measurement_profile');
            $table->decimal('chest', 12, 2)->nullable();
            $table->decimal('waist', 12, 2)->nullable();
            $table->decimal('hip', 12, 2)->nullable();
            $table->decimal('shoulder', 12, 2)->nullable();
            $table->decimal('sleeve', 12, 2)->nullable();
            $table->decimal('length', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('textile_color_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('color_name');
            $table->string('shade_code')->nullable();
            $table->string('unit_type')->default('yard');
            $table->decimal('available_quantity', 14, 3)->default(0);
            $table->decimal('consignment_quantity', 14, 3)->default(0);
            $table->decimal('wholesale_price', 14, 2)->nullable();
            $table->decimal('retail_price', 14, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('textile_style_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('measurement_id')->nullable()->constrained('textile_customer_measurements')->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('textile_color_variants')->nullOnDelete();
            $table->string('order_number')->unique();
            $table->string('style_name');
            $table->string('garment_type')->nullable();
            $table->string('status')->default('intake');
            $table->decimal('fabric_quantity', 14, 3)->default(0);
            $table->string('fabric_unit')->default('yard');
            $table->decimal('labour_charge', 14, 2)->default(0);
            $table->decimal('fabric_charge', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->text('design_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('tailoring_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('style_order_id')->constrained('textile_style_orders')->cascadeOnDelete();
            $table->string('assigned_tailor')->nullable();
            $table->string('stage')->default('cutting');
            $table->string('priority')->default('normal');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('textile_consignment_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('textile_color_variants')->nullOnDelete();
            $table->string('partner_name');
            $table->decimal('quantity_sent', 14, 3);
            $table->decimal('quantity_returned', 14, 3)->default(0);
            $table->decimal('quantity_sold', 14, 3)->default(0);
            $table->decimal('settlement_due', 14, 2)->default(0);
            $table->string('status')->default('open');
            $table->date('sent_date');
            $table->date('due_back_date')->nullable();
            $table->timestamps();
        });

        Schema::create('textile_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('style_order_id')->nullable()->constrained('textile_style_orders')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('unit_type')->default('yard');
            $table->decimal('quantity', 14, 3)->default(0);
            $table->decimal('rate', 14, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->string('status')->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('textile_invoices');
        Schema::dropIfExists('textile_consignment_stocks');
        Schema::dropIfExists('tailoring_jobs');
        Schema::dropIfExists('textile_style_orders');
        Schema::dropIfExists('textile_color_variants');
        Schema::dropIfExists('textile_customer_measurements');
    }
};
