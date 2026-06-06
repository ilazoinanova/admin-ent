<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','accounting','ready','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','accounting','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft'");
    }
};
