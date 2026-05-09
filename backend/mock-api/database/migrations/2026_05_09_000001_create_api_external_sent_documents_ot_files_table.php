<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // La tabla ya existe en producción — solo agrega department_id para facturación por departamento.
    public function up(): void
    {
        Schema::table('api_external_sent_documents_ot_files', function (Blueprint $table) {
            if (! Schema::hasColumn('api_external_sent_documents_ot_files', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('tenant_id')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('api_external_sent_documents_ot_files', function (Blueprint $table) {
            if (Schema::hasColumn('api_external_sent_documents_ot_files', 'department_id')) {
                $table->dropColumn('department_id');
            }
        });
    }
};
