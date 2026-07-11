<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('category', 50)->nullable()->after('description');
            $table->text('notes')->nullable()->after('unit');

            // price y currency se conservan nullable para uso futuro
            $table->decimal('price', 12, 2)->nullable()->change();
            $table->string('currency', 10)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['category', 'notes']);
        });
    }
};
