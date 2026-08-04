<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('role')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract'])->default('full_time');
            $table->decimal('salary', 15, 2)->nullable();
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'terminated'])->default('active');
            $table->timestamps();

            $table->unique(['business_id', 'phone']);
        });

        Schema::create('referral_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('referrer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('code')->unique();
            $table->decimal('commission_percent', 5, 2)->default(5);
            $table->integer('uses')->default(0);
            $table->integer('max_uses')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('referral_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('referral_code_id')->constrained()->onDelete('cascade');
            $table->foreignId('referred_customer_id')->constrained('customers')->onDelete('cascade');
            $table->decimal('purchase_amount', 15, 2);
            $table->decimal('commission_amount', 15, 2);
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_earnings');
        Schema::dropIfExists('referral_codes');
        Schema::dropIfExists('staff');
    }
};