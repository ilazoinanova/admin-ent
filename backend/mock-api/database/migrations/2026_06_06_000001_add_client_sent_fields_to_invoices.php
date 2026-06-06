<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('client_email_to')->nullable()->after('accounting_sent_at');
            $table->string('client_email_cc')->nullable()->after('client_email_to');
            $table->timestamp('client_sent_at')->nullable()->after('client_email_cc');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['client_email_to', 'client_email_cc', 'client_sent_at']);
        });
    }
};
