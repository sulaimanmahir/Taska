<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->json('active_business_types')->nullable()->after('business_type');
        });

        // Backfill: every existing business gets a one-element array identical
        // to its current business_type - no observable behavior change until a
        // business is explicitly given a second active vertical.
        DB::table('businesses')->select('id', 'business_type')->orderBy('id')->chunkById(200, function ($businesses) {
            foreach ($businesses as $business) {
                DB::table('businesses')
                    ->where('id', $business->id)
                    ->update(['active_business_types' => json_encode([$business->business_type])]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('active_business_types');
        });
    }
};
