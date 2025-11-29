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
        Schema::create('ad_evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_plan_id')->constrained('ad_plans')->cascadeOnDelete();
            $table->string('previous_event_name'); // integrasi dengan data dari event batch sebelumnya
            $table->integer('previous_checkout');
            $table->integer('current_checkout'); // integrasi dengan data dari data event batch sebelumnya
            $table->longText('previous_ad_performance');
            $table->longText('current_ad_performance');
            $table->longText('previous_other_performance');
            $table->longText('current_other_performance');
            $table->longText('next_ad_strategy');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_evaluations');
    }
};
