<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ngo_donor_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('compliance_reference')->nullable();
            $table->timestamps();
        });

        Schema::create('ngo_partner_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('partner_name');
            $table->string('request_reference');
            $table->string('status')->default('pending');
            $table->text('request_notes')->nullable();
            $table->date('needed_by')->nullable();
            $table->timestamps();
        });

        Schema::create('ngo_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('partner_request_id')->nullable()->constrained('ngo_partner_requests')->nullOnDelete();
            $table->foreignId('donor_source_id')->nullable()->constrained('ngo_donor_sources')->nullOnDelete();
            $table->string('distribution_reference');
            $table->string('beneficiary_name');
            $table->string('destination_location')->nullable();
            $table->string('status')->default('planned');
            $table->date('distributed_on')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ngo_distribution_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained('ngo_distributions')->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 15, 3)->default(0);
            $table->timestamps();
        });

        Schema::create('ngo_distribution_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained('ngo_distributions')->onDelete('cascade');
            $table->string('beneficiary_name');
            $table->string('signed_by');
            $table->string('signature_reference')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ngo_waybills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained('ngo_distributions')->onDelete('cascade');
            $table->string('waybill_number');
            $table->string('driver_name')->nullable();
            $table->string('vehicle_reference')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ngo_waybills');
        Schema::dropIfExists('ngo_distribution_signatures');
        Schema::dropIfExists('ngo_distribution_items');
        Schema::dropIfExists('ngo_distributions');
        Schema::dropIfExists('ngo_partner_requests');
        Schema::dropIfExists('ngo_donor_sources');
    }
};
