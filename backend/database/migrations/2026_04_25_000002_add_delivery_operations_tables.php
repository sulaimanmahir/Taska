<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_manifests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('delivery_vehicles')->nullOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('manifest_code')->unique();
            $table->string('title');
            $table->enum('status', ['draft', 'dispatched', 'closed'])->default('draft');
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_manifest_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manifest_id')->constrained('delivery_manifests')->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['manifest_id', 'delivery_order_id']);
        });

        Schema::create('delivery_disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('category');
            $table->enum('status', ['open', 'reviewing', 'resolved'])->default('open');
            $table->text('summary');
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_disputes');
        Schema::dropIfExists('delivery_manifest_items');
        Schema::dropIfExists('delivery_manifests');
    }
};
