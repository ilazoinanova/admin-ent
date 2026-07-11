<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_departments', function (Blueprint $table) {
            $table->boolean('use_department_billing')->default(false)->after('description');
            $table->boolean('applies_tax')->nullable()->after('use_department_billing');
            $table->string('tax_name', 50)->nullable()->after('applies_tax');
            $table->decimal('tax_percent', 5, 2)->nullable()->after('tax_name');
            $table->enum('billing_cycle', ['monthly', 'quarterly', 'biannual', 'annual'])->nullable()->after('tax_percent');
            $table->tinyInteger('billing_day_from')->nullable()->after('billing_cycle');
            $table->tinyInteger('billing_day_to')->nullable()->after('billing_day_from');
            $table->char('currency', 3)->nullable()->after('billing_day_to');
            $table->smallInteger('payment_terms_days')->nullable()->after('currency');
            $table->string('billing_email', 255)->nullable()->after('payment_terms_days');
            $table->string('billing_contact', 255)->nullable()->after('billing_email');
            $table->text('billing_notes')->nullable()->after('billing_contact');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_departments', function (Blueprint $table) {
            $table->dropColumn([
                'use_department_billing',
                'applies_tax',
                'tax_name',
                'tax_percent',
                'billing_cycle',
                'billing_day_from',
                'billing_day_to',
                'currency',
                'payment_terms_days',
                'billing_email',
                'billing_contact',
                'billing_notes',
            ]);
        });
    }
};
