<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livestock_market_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('transaction_number')->unique();
            $table->string('transaction_type'); // intake (bought from herder/farmer), sale (sold to buyer)
            $table->string('animal_type'); // cattle, goat, sheep, camel, poultry, other
            $table->unsignedInteger('head_count');
            $table->decimal('total_weight_kg', 12, 2)->nullable();
            $table->decimal('unit_price_per_kg', 12, 2)->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->string('counterparty_name');
            $table->string('counterparty_phone')->nullable();
            $table->date('market_date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('business_id');
            $table->index(['business_id', 'market_date']);
            $table->index(['business_id', 'transaction_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livestock_market_transactions');
    }
};
