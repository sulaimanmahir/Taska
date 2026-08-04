<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('generic_product_id')->nullable()->constrained('products')->nullOnDelete()->after('pharmacy_category');
            $table->string('medicine_type')->nullable()->after('generic_product_id');
            $table->boolean('is_controlled_drug')->default(false)->after('medicine_type');
            $table->boolean('allow_substitution')->default(false)->after('is_controlled_drug');
            $table->unsignedInteger('refill_cycle_days')->nullable()->after('allow_substitution');
        });

        Schema::table('product_batches', function (Blueprint $table) {
            $table->decimal('near_expiry_discount_percent', 8, 2)->default(0)->after('cost_per_unit');
            $table->decimal('discounted_price', 15, 2)->default(0)->after('near_expiry_discount_percent');
        });

        Schema::create('medicine_substitution_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('substitute_product_id')->constrained('products')->cascadeOnDelete();
            $table->string('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('controlled_drug_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('movement_type');
            $table->decimal('quantity', 15, 2);
            $table->string('prescription_reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('pharmacy_dispenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->foreignId('substituted_from_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->decimal('quantity', 15, 2);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('prescription_reference')->nullable();
            $table->boolean('refill_due')->default(false);
            $table->timestamp('dispensed_at');
            $table->timestamps();
        });

        Schema::create('refill_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pharmacy_dispense_id')->nullable()->constrained('pharmacy_dispenses')->nullOnDelete();
            $table->date('due_on');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refill_reminders');
        Schema::dropIfExists('pharmacy_dispenses');
        Schema::dropIfExists('controlled_drug_logs');
        Schema::dropIfExists('medicine_substitution_rules');

        Schema::table('product_batches', function (Blueprint $table) {
            $table->dropColumn(['near_expiry_discount_percent', 'discounted_price']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('generic_product_id');
            $table->dropColumn(['medicine_type', 'is_controlled_drug', 'allow_substitution', 'refill_cycle_days']);
        });
    }
};
