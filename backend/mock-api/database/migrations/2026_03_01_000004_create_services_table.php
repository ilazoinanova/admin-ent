<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 100)->nullable()->unique();
            $table->text('description')->nullable();
            $table->string('unit', 50)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->string('currency', 10)->default('CLP');
            $table->tinyInteger('status')->default(1);
            $table->integer('deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
