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
            $table->string('cost_month', 20)->nullable()->after('ad_schedule_time');
            $table->string('revenue_month', 20)->nullable()->after('cost_month');
        });

        Schema::table('ad_results', function (Blueprint $table) {
            $table->integer('checkout_weekend')->nullable()->after('checkout_count');
            $table->integer('checkout_weekday')->nullable()->after('checkout_weekend');
            $table->string('cost_month', 20)->nullable()->after('revenue');
            $table->string('revenue_month', 20)->nullable()->after('cost_month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_plans', function (Blueprint $table) {
            $table->dropColumn(['cost_month', 'revenue_month']);
        });

        Schema::table('ad_results', function (Blueprint $table) {
            $table->dropColumn(['checkout_weekend', 'checkout_weekday', 'cost_month', 'revenue_month']);
        });
    }
};
