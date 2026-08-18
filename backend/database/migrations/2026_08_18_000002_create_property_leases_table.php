<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_leases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('property_unit_id')->constrained('property_units')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('rent_amount', 15, 2);
            $table->decimal('service_charge_amount', 15, 2)->nullable();
            // Days between recurring rent charges: 30 (monthly), 90 (quarterly),
            // 365 (annual, the Nigerian residential-lease norm) - same shape as
            // TrustAccount's contribution_frequency_days.
            $table->unsignedInteger('payment_frequency_days')->default(365);
            $table->decimal('deposit_amount', 15, 2)->nullable();
            // Running balance, same pattern as TrustAccount.balance - updated by
            // each PropertyRentLedgerEntry rather than recomputed live, so it's
            // always a fast, single-column read.
            $table->decimal('balance', 15, 2)->default(0);
            $table->date('next_due_date')->nullable();
            $table->string('status')->default('active'); // active, ended, terminated
            $table->timestamps();

            $table->index('business_id');
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_leases');
    }
};
