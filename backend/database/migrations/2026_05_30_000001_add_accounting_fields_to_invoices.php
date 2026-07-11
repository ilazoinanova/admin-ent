<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('accounting_email_to', 255)->nullable()->after('qr_url');
            $table->string('accounting_email_subject', 500)->nullable()->after('accounting_email_to');
            $table->timestamp('accounting_sent_at')->nullable()->after('accounting_email_subject');
            $table->string('fiscal_pdf_url', 2048)->nullable()->after('accounting_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'accounting_email_to',
                'accounting_email_subject',
                'accounting_sent_at',
                'fiscal_pdf_url',
            ]);
        });
    }
};
