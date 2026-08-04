<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('batch_number')->index();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('remaining_quantity', 15, 2)->default(0);
            $table->decimal('cost_per_unit', 15, 2)->default(0);
            $table->string('supplier')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['business_id', 'product_id']);
            $table->index('expiry_date');
        });

        Schema::create('batch_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_batch_id')->constrained('product_batches')->onDelete('cascade');
            $table->foreignId('warehouse_id')->nullable()->constrained()->onDelete('set null');
            $table->string('movement_type'); // received, sold, returned, expired, transferred
            $table->decimal('quantity', 15, 2);
            $table->string('reference_type')->nullable();
            $table->bigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('expiry_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_batch_id')->constrained('product_batches')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, notified, resolved
            $table->integer('days_before_expiry');
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('track_expiry')->default(false)->after('track_inventory');
            $table->boolean('is_prescription_required')->default(false)->after('track_expiry');
            $table->string('pharmacy_category')->nullable()->after('is_prescription_required');
            $table->date('default_expiry_months')->nullable()->after('pharmacy_category');
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->boolean('expiry_tracking_enabled')->default(false);
            $table->integer('expiry_warning_days')->default(30);
            $table->boolean('prescription_required_enabled')->default(false);
            $table->boolean('controlled_drugs_tracking')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['expiry_tracking_enabled', 'expiry_warning_days', 'prescription_required_enabled', 'controlled_drugs_tracking']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['track_expiry', 'is_prescription_required', 'pharmacy_category', 'default_expiry_months']);
        });

        Schema::dropIfExists('expiry_alerts');
        Schema::dropIfExists('batch_movements');
        Schema::dropIfExists('product_batches');
    }
};