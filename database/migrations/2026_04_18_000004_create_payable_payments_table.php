<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payable_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payable_id')->constrained('payables');
            $table->string('period', 7);              // "2026-04" (año-mes del periodo)
            $table->date('due_date');
            $table->decimal('amount', 12, 2);
            $table->decimal('amount_paid', 12, 2)->nullable();
            $table->date('paid_at')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->integer('deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payable_payments');
    }
};
