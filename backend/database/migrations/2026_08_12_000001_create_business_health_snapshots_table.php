<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_health_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->date('snapshot_date');
            // 0-100 composite score. Stored (not recomputed on every page load)
            // so a "level" or trend chart has a stable historical value to read,
            // the same reason ai_insights persists rather than only computing
            // insights live.
            $table->unsignedTinyInteger('health_score');
            // Individual component scores (0-100 each) that fed into health_score,
            // kept so the UI can explain *why* the score is what it is per the
            // constitution's "interpret data, don't just display it" principle
            // (docs/TASKA_DESIGN_CONSTITUTION.md §17) instead of a bare number.
            $table->unsignedTinyInteger('revenue_trend_score')->nullable();
            $table->unsignedTinyInteger('expense_control_score')->nullable();
            $table->unsignedTinyInteger('stock_health_score')->nullable();
            $table->unsignedTinyInteger('receivables_health_score')->nullable();
            $table->json('signals')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'snapshot_date']);
            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_health_snapshots');
    }
};
