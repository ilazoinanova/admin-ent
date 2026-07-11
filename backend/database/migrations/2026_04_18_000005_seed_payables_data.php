<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $payables = [
            [
                'name'       => 'Internet Fibra Óptica',
                'category'   => 'servicio',
                'vendor'     => 'Claro Empresas',
                'amount'     => 89990,
                'currency'   => 'CLP',
                'frequency'  => 'monthly',
                'due_day'    => 5,
                'start_date' => '2026-01-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => 'Plan 600 Mbps simétrico',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Arriendo Oficina Piso 3',
                'category'   => 'arriendo',
                'vendor'     => 'Inmobiliaria del Centro S.A.',
                'amount'     => 1500000,
                'currency'   => 'CLP',
                'frequency'  => 'monthly',
                'due_day'    => 1,
                'start_date' => '2025-03-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => 'Contrato hasta 2027-02-28',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Mantenimiento Aire Acondicionado',
                'category'   => 'mantenimiento',
                'vendor'     => 'TechCool Ltda.',
                'amount'     => 250000,
                'currency'   => 'CLP',
                'frequency'  => 'quarterly',
                'due_day'    => 15,
                'start_date' => '2026-01-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => 'Revisión preventiva trimestral incluye filtros',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Suscripción GitHub Teams',
                'category'   => 'suscripcion',
                'vendor'     => 'GitHub Inc.',
                'amount'     => 40,
                'currency'   => 'USD',
                'frequency'  => 'monthly',
                'due_day'    => 10,
                'start_date' => '2025-06-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => '5 usuarios × $8/mes',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Licencia Microsoft 365 Business',
                'category'   => 'suscripcion',
                'vendor'     => 'Microsoft Corporation',
                'amount'     => 180,
                'currency'   => 'USD',
                'frequency'  => 'monthly',
                'due_day'    => 20,
                'start_date' => '2025-01-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => '15 usuarios × $12/mes',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Servicio de Limpieza',
                'category'   => 'servicio',
                'vendor'     => 'Aseo Profesional SpA',
                'amount'     => 320000,
                'currency'   => 'CLP',
                'frequency'  => 'monthly',
                'due_day'    => 28,
                'start_date' => '2026-02-01',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => '4 veces por semana',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Seguro Oficina y Equipos',
                'category'   => 'otro',
                'vendor'     => 'Seguros Mapfre',
                'amount'     => 480000,
                'currency'   => 'CLP',
                'frequency'  => 'annual',
                'due_day'    => 15,
                'start_date' => '2026-01-15',
                'end_date'   => null,
                'status'     => 1,
                'notes'      => 'Póliza todo riesgo equipos y responsabilidad civil',
                'deleted'    => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('payables')->insert($payables);

        // Pagos de los últimos 3 meses para las cuentas mensuales
        $payments = [];

        foreach (['2026-02', '2026-03', '2026-04'] as $idx => $period) {
            [$year, $month] = explode('-', $period);

            // Internet (payable_id=1, due_day=5)
            $payments[] = [
                'payable_id'  => 1,
                'period'      => $period,
                'due_date'    => "$year-$month-05",
                'amount'      => 89990,
                'amount_paid' => $period !== '2026-04' ? 89990 : null,
                'paid_at'     => $period !== '2026-04' ? "$year-$month-04" : null,
                'status'      => $period !== '2026-04' ? 'paid' : 'pending',
                'reference'   => $period !== '2026-04' ? 'REC-' . rand(10000, 99999) : null,
                'notes'       => null,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            // Arriendo (payable_id=2, due_day=1)
            $payments[] = [
                'payable_id'  => 2,
                'period'      => $period,
                'due_date'    => "$year-$month-01",
                'amount'      => 1500000,
                'amount_paid' => $period !== '2026-04' ? 1500000 : null,
                'paid_at'     => $period !== '2026-04' ? "$year-$month-01" : null,
                'status'      => $period !== '2026-04' ? 'paid' : 'overdue',
                'reference'   => $period !== '2026-04' ? 'TRF-' . rand(100000, 999999) : null,
                'notes'       => null,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            // GitHub (payable_id=4, due_day=10)
            $payments[] = [
                'payable_id'  => 4,
                'period'      => $period,
                'due_date'    => "$year-$month-10",
                'amount'      => 40,
                'amount_paid' => $period !== '2026-04' ? 40 : null,
                'paid_at'     => $period !== '2026-04' ? "$year-$month-10" : null,
                'status'      => $period !== '2026-04' ? 'paid' : 'pending',
                'reference'   => $period !== '2026-04' ? 'GH-' . rand(1000, 9999) : null,
                'notes'       => null,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            // Microsoft 365 (payable_id=5, due_day=20)
            $payments[] = [
                'payable_id'  => 5,
                'period'      => $period,
                'due_date'    => "$year-$month-20",
                'amount'      => 180,
                'amount_paid' => $period === '2026-02' ? 180 : null,
                'paid_at'     => $period === '2026-02' ? "$year-$month-20" : null,
                'status'      => $period === '2026-02' ? 'paid' : 'overdue',
                'reference'   => $period === '2026-02' ? 'MS-' . rand(10000, 99999) : null,
                'notes'       => null,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            // Limpieza (payable_id=6, due_day=28)
            $payments[] = [
                'payable_id'  => 6,
                'period'      => $period,
                'due_date'    => "$year-$month-28",
                'amount'      => 320000,
                'amount_paid' => $period === '2026-02' ? 320000 : null,
                'paid_at'     => $period === '2026-02' ? "$year-$month-27" : null,
                'status'      => $period === '2026-02' ? 'paid' : 'pending',
                'reference'   => $period === '2026-02' ? 'ASE-' . rand(1000, 9999) : null,
                'notes'       => null,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];
        }

        // Trimestral mantenimiento (payable_id=3): pagos enero y abril
        $payments[] = [
            'payable_id'  => 3,
            'period'      => '2026-01',
            'due_date'    => '2026-01-15',
            'amount'      => 250000,
            'amount_paid' => 250000,
            'paid_at'     => '2026-01-14',
            'status'      => 'paid',
            'reference'   => 'TC-' . rand(1000, 9999),
            'notes'       => 'Pago Q1 2026',
            'deleted'     => 0,
            'created_at'  => $now,
            'updated_at'  => $now,
        ];
        $payments[] = [
            'payable_id'  => 3,
            'period'      => '2026-04',
            'due_date'    => '2026-04-15',
            'amount'      => 250000,
            'amount_paid' => null,
            'paid_at'     => null,
            'status'      => 'pending',
            'reference'   => null,
            'notes'       => 'Pendiente Q2 2026',
            'deleted'     => 0,
            'created_at'  => $now,
            'updated_at'  => $now,
        ];

        // Seguro anual (payable_id=7): pago enero
        $payments[] = [
            'payable_id'  => 7,
            'period'      => '2026-01',
            'due_date'    => '2026-01-15',
            'amount'      => 480000,
            'amount_paid' => 480000,
            'paid_at'     => '2026-01-15',
            'status'      => 'paid',
            'reference'   => 'SEG-2026',
            'notes'       => 'Póliza anual pagada',
            'deleted'     => 0,
            'created_at'  => $now,
            'updated_at'  => $now,
        ];

        DB::table('payable_payments')->insert($payments);
    }

    public function down(): void
    {
        DB::table('payable_payments')->truncate();
        DB::table('payables')->truncate();
    }
};
