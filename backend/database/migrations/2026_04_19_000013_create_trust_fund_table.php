<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trust_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->enum('account_type', ['credit', 'contribution'])->default('credit');
            $table->decimal('limit', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('total_repaid', 15, 2)->default(0);
            $table->date('last_payment_date')->nullable();
            $table->enum('status', ['active', 'suspended', 'closed'])->default('active');
            $table->timestamps();

            $table->unique(['business_id', 'customer_id', 'account_type']);
        });

        Schema::create('trust_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('trust_account_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('type', ['draw', 'repayment', 'adjustment', 'charge'])->default('draw');
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2)->default(0);
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->date('transaction_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trust_transactions');
        Schema::dropIfExists('trust_accounts');
    }
};