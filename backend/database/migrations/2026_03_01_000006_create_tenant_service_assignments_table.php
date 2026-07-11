<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_service_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->string('license_type')->nullable();
            $table->enum('license_modalidad', ['fixed', 'tiered_fixed', 'tiered_escalating'])->nullable();
            $table->enum('billing_cycle', ['mensual', 'trimestral', 'semestral', 'anual'])->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->enum('development_type', ['unico', 'bolsa_horas'])->nullable();
            $table->decimal('hours_total', 10, 2)->nullable();
            $table->decimal('hours_used', 10, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('unit', 50)->nullable();
            $table->tinyInteger('status')->default(0);
            $table->integer('deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_service_assignments');
    }
};
