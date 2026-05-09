<?php

namespace App\Services;

use App\Models\TenantService;
use Illuminate\Support\Facades\DB;

class IntegrationBillingService
{
    /**
     * Cuenta documentos únicos enviados durante el período para un tenant/department.
     * Deduplicación por: project_id + system_integration_name + ot_number + date + report_type
     * Criterios: sent = 1, sync_status = 'sent', deleted = 0, date BETWEEN period_from AND period_to
     */
    public function countBillableDocuments(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): int
    {
        return DB::table('api_external_sent_documents_ot_files')
            ->where('tenant_id', $tenantId)
            ->where('department_id', $departmentId)
            ->where('sent', 1)
            ->where('sync_status', 'sent')
            ->where('deleted', 0)
            ->whereBetween('date', [$periodFrom, $periodTo])
            ->select(['project_id', 'system_integration_name', 'ot_number', 'date', 'report_type'])
            ->distinct()
            ->get()
            ->count();
    }

    /**
     * Precio fijo: conteo de documentos únicos × price del assignment.
     * El precio se toma directamente del campo price en tenant_service_assignments.
     */
    public function calculateForAssignment(TenantService $assignment, string $periodFrom, string $periodTo): array
    {
        $count        = $this->countBillableDocuments(
            $assignment->tenant_id,
            $assignment->department_id,
            $periodFrom,
            $periodTo
        );
        $pricePerDoc  = (float) ($assignment->price ?? 0);
        $total        = round($count * $pricePerDoc, 2);

        return [
            'active_licenses_count' => $count,
            'price_per_document'    => $pricePerDoc,
            'total_price'           => $total,
        ];
    }
}
