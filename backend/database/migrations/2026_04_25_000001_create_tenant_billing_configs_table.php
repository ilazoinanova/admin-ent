<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_billing_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')
                  ->unique()
                  ->constrained('tenants')
                  ->onDelete('cascade');

            // Impuestos
            $table->boolean('applies_tax')->default(false);
            $table->string('tax_name', 50)->nullable()->default('IVA');
            $table->decimal('tax_percent', 5, 2)->default(0.00);

            // Ciclo de facturación
            $table->enum('billing_cycle', ['monthly', 'quarterly', 'biannual', 'annual'])->default('monthly');
            $table->tinyInteger('billing_day_from')->unsigned()->default(1);
            $table->tinyInteger('billing_day_to')->unsigned()->default(28);

            // Finanzas
            $table->char('currency', 3)->default('USD');
            $table->smallInteger('payment_terms_days')->unsigned()->default(30);

            // Contacto
            $table->string('billing_email')->nullable();
            $table->string('billing_contact')->nullable();

            // Notas
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_billing_configs');
    }
};
