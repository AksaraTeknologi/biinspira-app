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
        Schema::create('ad_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_plan_id')->constrained('ad_plans')->cascadeOnDelete();
            $table->integer('checkout_count');
            $table->decimal('revenue', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_results');
    }
};
