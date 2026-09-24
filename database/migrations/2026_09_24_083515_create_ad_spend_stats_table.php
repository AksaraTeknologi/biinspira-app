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
        Schema::create('ad_spend_stats', function (Blueprint $table) {
            $table->id();
            $table->string('platform', 60)->index();
            $table->date('date')->index();
            $table->decimal('amount', 15, 2);
            $table->string('ad_channel', 40)->index();
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
        Schema::dropIfExists('ad_spend_stats');
    }
};
