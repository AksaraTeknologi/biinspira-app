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
        Schema::table('ad_plans', function (Blueprint $table) {
            $table->time("ad_schedule_time");
            $table->string("title_flayer")->nullable();
            $table->string("image_flayer")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_plans', function (Blueprint $table) {
            $table->dropColumn("ad_schedule_time");
            $table->dropColumn("title_flayer");
            $table->dropColumn("image_flayer");
        });
    }
};
