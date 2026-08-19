<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            // Tracks whether a push notification has already been sent for this
            // insight, so the scheduled critical-alert sender never pushes the
            // same insight twice - separate from is_read (which reflects the
            // user viewing it in-app, not whether a device was pushed).
            $table->timestamp('notified_at')->nullable()->after('is_dismissed');
        });
    }

    public function down(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->dropColumn('notified_at');
        });
    }
};
