<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->char('billing_period', 7)->nullable()->after('department_id');  // YYYY-MM
            $table->date('period_from')->nullable()->after('billing_period');
            $table->date('period_to')->nullable()->after('period_from');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['billing_period', 'period_from', 'period_to']);
        });
    }
};
