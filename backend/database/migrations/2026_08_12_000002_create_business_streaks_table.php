<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            // Matches a key in config/gamification.php's 'streaks' catalog
            // (e.g. 'daily_sales_logged', 'zero_overdue_receivables') - the
            // catalog is code (like config/business_types.php), the count is
            // tenant data.
            $table->string('streak_type');
            $table->unsignedInteger('current_count')->default(0);
            $table->unsignedInteger('best_count')->default(0);
            $table->date('last_active_date')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'streak_type']);
            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_streaks');
    }
};
