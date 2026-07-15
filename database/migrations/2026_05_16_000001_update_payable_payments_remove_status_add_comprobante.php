<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payable_payments', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->string('comprobante_path')->nullable()->after('notes');
            $table->string('comprobante_name')->nullable()->after('comprobante_path');
        });
    }

    public function down(): void
    {
        Schema::table('payable_payments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending')->after('paid_at');
            $table->dropColumn(['comprobante_path', 'comprobante_name']);
        });
    }
};
