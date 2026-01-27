<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('ad_result_platforms', function (Blueprint $table) {
            $table->longText('media_partner')->nullable()->after('result');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_result_platforms', function (Blueprint $table) {
            $table->dropColumn('media_partner');
        });
    }
};
