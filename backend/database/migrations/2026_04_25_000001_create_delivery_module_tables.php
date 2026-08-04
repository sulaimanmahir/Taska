<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('landmark')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('vehicle_type')->default('motorcycle');
            $table->enum('ownership_model', ['company_owned', 'investor_owned', 'partner_owned', 'rider_owned', 'investor_rider']);
            $table->string('plate_number')->nullable();
            $table->string('owner_name');
            $table->json('owner_details')->nullable();
            $table->decimal('purchase_value', 15, 2)->default(0);
            $table->enum('fuel_responsibility', ['company', 'owner', 'rider'])->default('company');
            $table->enum('maintenance_responsibility', ['company', 'owner', 'rider'])->default('company');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('pickup_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('dropoff_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('sender_contact_id')->constrained('delivery_contacts')->cascadeOnDelete();
            $table->foreignId('recipient_contact_id')->constrained('delivery_contacts')->cascadeOnDelete();
            $table->foreignId('assigned_rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('delivery_vehicles')->nullOnDelete();
            $table->string('tracking_code')->unique();
            $table->enum('status', ['pending_pickup', 'picked_up', 'in_transit', 'delivered', 'failed', 'rescheduled', 'cancelled'])->default('pending_pickup');
            $table->string('parcel_category');
            $table->text('parcel_description')->nullable();
            $table->string('pricing_model')->default('flat');
            $table->decimal('distance_km', 10, 2)->nullable();
            $table->decimal('base_fee', 15, 2)->default(0);
            $table->decimal('distance_fee', 15, 2)->default(0);
            $table->decimal('urgent_fee', 15, 2)->default(0);
            $table->decimal('total_fee', 15, 2)->default(0);
            $table->decimal('cod_amount', 15, 2)->default(0);
            $table->decimal('amount_remitted', 15, 2)->default(0);
            $table->boolean('is_urgent')->default(false);
            $table->string('pickup_address');
            $table->string('dropoff_address');
            $table->text('failed_delivery_reason')->nullable();
            $table->timestamp('rescheduled_for')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('proof_of_pickup_url')->nullable();
            $table->string('proof_of_delivery_url')->nullable();
            $table->boolean('created_offline')->default(false);
            $table->string('device_id')->nullable();
            $table->timestamp('local_timestamp')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_status_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status');
            $table->text('notes')->nullable();
            $table->string('proof_url')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('recorded_offline')->default(false);
            $table->string('device_id')->nullable();
            $table->timestamp('local_timestamp')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->cascadeOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('delivery_vehicles')->nullOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_delivery_fee', 15, 2)->default(0);
            $table->decimal('rider_share', 15, 2)->default(0);
            $table->decimal('owner_share', 15, 2)->default(0);
            $table->decimal('company_share', 15, 2)->default(0);
            $table->decimal('fuel_deduction', 15, 2)->default(0);
            $table->decimal('maintenance_deduction', 15, 2)->default(0);
            $table->decimal('net_rider_payout', 15, 2)->default(0);
            $table->decimal('net_owner_payout', 15, 2)->default(0);
            $table->decimal('company_retained_earnings', 15, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_settlements');
        Schema::dropIfExists('delivery_status_events');
        Schema::dropIfExists('delivery_orders');
        Schema::dropIfExists('delivery_vehicles');
        Schema::dropIfExists('delivery_contacts');
    }
};
