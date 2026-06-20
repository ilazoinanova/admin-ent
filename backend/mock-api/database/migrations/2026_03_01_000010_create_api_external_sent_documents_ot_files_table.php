<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_external_sent_documents_ot_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->string('system_integration_name');
            $table->string('ot_number');
            $table->date('date');
            $table->string('report_type')->nullable();
            $table->tinyInteger('sent')->default(0);
            $table->string('sync_status', 50)->default('pending');
            $table->integer('deleted')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'date']);
            $table->index('sync_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_external_sent_documents_ot_files');
    }
};
