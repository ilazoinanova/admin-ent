<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payable_payments', function (Blueprint $table) {
            // Hacemos payable_id nullable para los pagos adicionales libres
            $table->unsignedBigInteger('payable_id')->nullable()->change();

            // Vínculo al período del mantenedor
            $table->unsignedBigInteger('payment_period_id')->nullable()->after('id');
            $table->foreign('payment_period_id')->references('id')->on('payment_periods')->nullOnDelete();

            // Tipo: false = generado desde plantilla, true = pago adicional libre
            $table->boolean('is_additional')->default(false)->after('payment_period_id');

            // Campos para pagos adicionales
            $table->string('title')->nullable()->after('is_additional');
            $table->text('description')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('payable_payments', function (Blueprint $table) {
            $table->dropForeign(['payment_period_id']);
            $table->dropColumn(['payment_period_id', 'is_additional', 'title', 'description']);
            $table->unsignedBigInteger('payable_id')->nullable(false)->change();
        });
    }
};
