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
            if (!Schema::hasColumn('ad_plans', 'cost_month_2')) {
                $table->string('cost_month_2', 20)->nullable()->after('cost_month');
            }
        });

        Schema::table('ad_results', function (Blueprint $table) {
            if (!Schema::hasColumn('ad_results', 'cost_month_2')) {
                $table->string('cost_month_2', 20)->nullable()->after('cost_month');
            }
        });

        Schema::table('ad_result_platforms', function (Blueprint $table) {
            if (!Schema::hasColumn('ad_result_platforms', 'ad_plan_platform_id')) {
                $table->foreignUuid('ad_plan_platform_id')->nullable()->after('platform_id')->constrained('ad_plan_platforms')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('ad_result_platforms', 'cost_month_1_amount')) {
                $table->decimal('cost_month_1_amount', 15, 2)->nullable()->after('total_cost');
            }
            if (!Schema::hasColumn('ad_result_platforms', 'cost_month_2_amount')) {
                $table->decimal('cost_month_2_amount', 15, 2)->nullable()->after('cost_month_1_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_result_platforms', function (Blueprint $table) {
            if (Schema::hasColumn('ad_result_platforms', 'ad_plan_platform_id')) {
                $table->dropForeign(['ad_plan_platform_id']);
                $table->dropColumn(['ad_plan_platform_id']);
            }
            if (Schema::hasColumn('ad_result_platforms', 'cost_month_1_amount')) {
                $table->dropColumn(['cost_month_1_amount']);
            }
            if (Schema::hasColumn('ad_result_platforms', 'cost_month_2_amount')) {
                $table->dropColumn(['cost_month_2_amount']);
            }
        });

        Schema::table('ad_results', function (Blueprint $table) {
            if (Schema::hasColumn('ad_results', 'cost_month_2')) {
                $table->dropColumn('cost_month_2');
            }
        });

        Schema::table('ad_plans', function (Blueprint $table) {
            if (Schema::hasColumn('ad_plans', 'cost_month_2')) {
                $table->dropColumn('cost_month_2');
            }
        });
    }
};
