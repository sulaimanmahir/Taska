<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // A browser push endpoint URL - unique per device/browser install,
            // not per user, since one user can have several subscribed devices.
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique();
            $table->string('p256dh_key');
            $table->string('auth_token');
            $table->timestamps();

            $table->index(['business_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
