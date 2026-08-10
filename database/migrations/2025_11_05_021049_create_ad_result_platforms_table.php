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
        Schema::create('ad_result_platforms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_result_id')->constrained('ad_results')->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained('master_platforms')->cascadeOnDelete();
            $table->integer('result')->nullable(); // tergantung goalnya apa
            $table->longText('media_partner')->nullable();
            $table->decimal('total_cost', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_result_platforms');
    }
};
