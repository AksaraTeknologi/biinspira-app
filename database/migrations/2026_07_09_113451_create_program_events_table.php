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
        Schema::create('program_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['webinar', 'bootcamp', 'certification_program']);

            $table->string('title');
            $table->string('slug')->unique();
            $table->string('batch')->nullable();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();      // certif only
            $table->text('benefits')->nullable();
            $table->text('requirements')->nullable();            // bootcamp only
            $table->text('curriculum')->nullable();              // bootcamp only
            $table->text('terms_conditions')->nullable();        // certif only

            // Schedule (webinar uses start_time/end_time, others use start_date/end_date)
            $table->dateTime('start_time')->nullable();          // webinar
            $table->dateTime('end_time')->nullable();            // webinar
            $table->date('start_date')->nullable();              // bootcamp & certif
            $table->date('end_date')->nullable();                // bootcamp & certif
            $table->dateTime('registration_deadline')->nullable();
            $table->dateTime('socialization_registration_deadline')->nullable(); // certif only

            // Pricing
            $table->bigInteger('strikethrough_price')->default(0);
            $table->bigInteger('price')->default(0);
            $table->bigInteger('scholarship_price')->default(0); // certif only

            $table->integer('quota')->default(0);

            // URLs
            $table->string('group_url')->nullable();             // link grup WA/Telegram

            // Certification type (certif only)
            $table->enum('certif_type', ['regular', 'scholarship'])->nullable();


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_events');
    }
};
