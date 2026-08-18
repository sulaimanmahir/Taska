<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('unit_code')->unique();
            $table->string('property_name');
            $table->string('unit_type'); // apartment, shop, office, duplex, warehouse, land, other
            $table->string('address')->nullable();
            $table->unsignedTinyInteger('bedrooms')->nullable();
            $table->decimal('rent_amount', 15, 2);
            $table->decimal('service_charge_amount', 15, 2)->nullable();
            $table->string('status')->default('vacant'); // vacant, occupied, maintenance
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('business_id');
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_units');
    }
};
