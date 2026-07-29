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
        Schema::create('ad_plan_platforms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_plan_id')->constrained('ad_plans')->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained('master_platforms')->cascadeOnDelete();
            $table->foreignId('goals_id')->constrained('master_ad_goals')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('audience_target');
            $table->decimal('daily_budget', 15, 2);
            $table->enum('audience_type', ['targeted', 'broad', 'combined']);
            $table->string('age_targeted')->nullable();
            $table->string('age_broad')->nullable();
            $table->longText('location_targeted')->nullable();
            $table->longText('location_broad')->nullable();
            $table->string('type_audience_targeted')->nullable();
            $table->longText('name_audience_targeted')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_plan_platforms');
    }
};
