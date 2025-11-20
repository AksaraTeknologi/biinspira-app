<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ad_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_result_platform_id')->constrained('ad_result_platforms')->cascadeOnDelete();
            $table->integer('reach');
            $table->integer('impressions');
            $table->integer('cost_per_result');
            $table->integer('clicks')->nullable();
            $table->integer('likes')->nullable();
            $table->integer('saves')->nullable();
            $table->integer('shares')->nullable();
            $table->integer('profile_visits')->nullable();
            $table->integer('folows')->nullable();
            $table->integer('direct_messages')->nullable();
            $table->integer('external_link_clicks')->nullable();
            $table->integer('result_ads')->nullable();
            $table->integer('click_whatsapp')->nullable();
            $table->integer('chat_admin')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_metrics');
    }
};
