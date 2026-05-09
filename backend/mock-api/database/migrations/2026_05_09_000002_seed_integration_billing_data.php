<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // ── 1. Obtener primeros 2 tenants disponibles ──────────────────────────
        $tenants = DB::table('tenants')->where('status', 1)->limit(2)->pluck('id');

        if ($tenants->isEmpty()) {
            return;
        }

        $tenant1Id = $tenants->get(0);
        $tenant2Id = $tenants->count() > 1 ? $tenants->get(1) : $tenants->get(0);

        // Los assignments ya existen en el módulo de asignaciones con unit='integration'.
        // Este seeder solo inserta documentos de prueba.

        // ── 3. Documentos de prueba ────────────────────────────────────────────
        $integrations = ['SAP-ERP', 'ORACLE-CRM', 'SALESFORCE'];
        $reportTypes  = ['OT_MAINTENANCE', 'OT_INSPECTION', 'OT_REPAIR'];

        // Genera $count documentos únicos dentro del rango de fechas dado
        $makeDocRows = function (int $tenantId, int $count, string $dateFrom, string $dateTo, string $prefix) use ($now, $integrations, $reportTypes): array {
            $rows    = [];
            $fromTs  = strtotime($dateFrom);
            $toTs    = strtotime($dateTo);
            $daySpan = (int) (($toTs - $fromTs) / 86400) + 1;

            for ($i = 1; $i <= $count; $i++) {
                $offset = ($i - 1) % $daySpan;
                $date   = date('Y-m-d', $fromTs + $offset * 86400);

                $rows[] = [
                    'tenant_id'               => $tenantId,
                    'department_id'           => null,
                    'project_id'              => ($i % 5) + 1,
                    'system_integration_name' => $integrations[($i - 1) % 3],
                    'ot_number'               => $prefix . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'date'                    => $date,
                    'report_type'             => $reportTypes[($i - 1) % 3],
                    'sent'                    => 1,
                    'sync_status'             => 'sent',
                    'deleted'                 => 0,
                    'created_at'              => $now,
                    'updated_at'              => $now,
                ];
            }

            return $rows;
        };

        $docs = [];

        // Tenant 1 — Marzo: 33 docs → $24.75  |  Abril: 42 docs → $31.50
        $docs = array_merge($docs, $makeDocRows($tenant1Id, 33, '2026-03-01', '2026-03-28', 'T1-MAR-'));
        $docs = array_merge($docs, $makeDocRows($tenant1Id, 42, '2026-04-01', '2026-04-28', 'T1-APR-'));

        // Registros inválidos de tenant1 (no deben contarse)
        $docs[] = ['tenant_id' => $tenant1Id, 'department_id' => null, 'project_id' => 99, 'system_integration_name' => 'SAP-ERP', 'ot_number' => 'INVALID-0001', 'date' => '2026-03-05', 'report_type' => 'OT_MAINTENANCE', 'sent' => 0, 'sync_status' => 'sent',    'deleted' => 0, 'created_at' => $now, 'updated_at' => $now];
        $docs[] = ['tenant_id' => $tenant1Id, 'department_id' => null, 'project_id' => 99, 'system_integration_name' => 'SAP-ERP', 'ot_number' => 'INVALID-0002', 'date' => '2026-03-06', 'report_type' => 'OT_MAINTENANCE', 'sent' => 1, 'sync_status' => 'pending', 'deleted' => 0, 'created_at' => $now, 'updated_at' => $now];
        $docs[] = ['tenant_id' => $tenant1Id, 'department_id' => null, 'project_id' => 99, 'system_integration_name' => 'SAP-ERP', 'ot_number' => 'INVALID-0003', 'date' => '2026-03-07', 'report_type' => 'OT_MAINTENANCE', 'sent' => 1, 'sync_status' => 'sent',    'deleted' => 1, 'created_at' => $now, 'updated_at' => $now];

        // Tenant 2 — Marzo: 65 docs → $52.00  |  Abril: 120 docs → $96.00
        $docs = array_merge($docs, $makeDocRows($tenant2Id, 65,  '2026-03-01', '2026-03-28', 'T2-MAR-'));
        $docs = array_merge($docs, $makeDocRows($tenant2Id, 120, '2026-04-01', '2026-04-28', 'T2-APR-'));

        DB::table('api_external_sent_documents_ot_files')->insert($docs);
    }

    public function down(): void
    {
        DB::table('api_external_sent_documents_ot_files')
            ->where('ot_number', 'like', 'T1-%')
            ->orWhere('ot_number', 'like', 'T2-%')
            ->orWhere('ot_number', 'like', 'INVALID-%')
            ->delete();
    }
};
