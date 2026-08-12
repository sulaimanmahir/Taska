<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_achievement_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            // Matches a key in config/gamification.php's 'achievements' or
            // 'milestones' catalog. Both share this table (category column
            // distinguishes them) since they're the same shape: a one-time
            // "this business crossed a real threshold" event - no need for
            // two near-identical tables.
            $table->string('achievement_key');
            $table->string('category')->default('achievement'); // achievement, milestone
            $table->timestamp('unlocked_at');
            // The real business value that crossed the threshold (e.g.
            // {"revenue_total": 1000000}), kept so the achievement can be
            // displayed with the actual number, not just a badge name -
            // per the constitution's "show them their business" principle.
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'achievement_key']);
            $table->index('business_id');
            $table->index(['business_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_achievement_unlocks');
    }
};
