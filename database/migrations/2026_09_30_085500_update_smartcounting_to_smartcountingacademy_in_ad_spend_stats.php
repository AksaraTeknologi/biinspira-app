<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates existing ad_spend_stats from 'smartcounting' to 'smartcountingacademy' (Smartcounting Academy).
     * The key 'smartcounting' is now dedicated to the new 'Smartcounting' platform.
     */
    public function up(): void
    {
        if (Schema::hasTable('ad_spend_stats')) {
            DB::table('ad_spend_stats')
                ->where('platform', 'smartcounting')
                ->update(['platform' => 'smartcountingacademy']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ad_spend_stats')) {
            DB::table('ad_spend_stats')
                ->where('platform', 'smartcountingacademy')
                ->update(['platform' => 'smartcounting']);
        }
    }
};
