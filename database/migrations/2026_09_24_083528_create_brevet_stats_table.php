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
        Schema::create('brevet_stats', function (Blueprint $table) {
            $table->id();
            $table->string('platform', 60)->index();
            $table->string('batch', 150);
            $table->string('month', 30)->index();
            $table->unsignedSmallInteger('year')->default(2026)->index();
            $table->unsignedInteger('weekend')->default(0);
            $table->unsignedInteger('weekday')->default(0);
            $table->unsignedInteger('scholarship')->default(0);
            $table->unsignedInteger('other_brevet')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('brevet_stats');
    }
};
