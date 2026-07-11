<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payables', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');      // servicio, mantenimiento, arriendo, suscripcion, otro
            $table->string('vendor')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('CLP');
            $table->enum('frequency', ['monthly', 'quarterly', 'annual', 'one_time'])->default('monthly');
            $table->tinyInteger('due_day')->default(1);   // día del mes en que vence (1-31)
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->tinyInteger('status')->default(1);    // 1=activa, 0=inactiva
            $table->text('notes')->nullable();
            $table->integer('deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payables');
    }
};
