<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_periods', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['monthly', 'annual'])->default('monthly');
            $table->tinyInteger('month')->unsigned()->nullable(); // 1-12, solo para monthly
            $table->smallInteger('year')->unsigned();
            $table->tinyInteger('start_day')->unsigned(); // día inicio del período
            $table->tinyInteger('end_day')->unsigned();   // día cierre del período
            $table->boolean('active')->default(false);
            $table->boolean('deleted')->default(false);
            $table->timestamps();

            $table->index(['type', 'year', 'month']);
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_periods');
    }
};
