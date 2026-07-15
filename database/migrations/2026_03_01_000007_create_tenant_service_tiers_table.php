<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_service_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_service_id')->constrained('tenant_service_assignments')->onDelete('cascade');
            $table->integer('min_users');
            $table->integer('max_users');
            $table->decimal('price_per_user', 12, 2);
            $table->tinyInteger('active')->default(1);
            $table->integer('deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_service_tiers');
    }
};
