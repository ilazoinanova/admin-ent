<?php

namespace App\Services;

use App\Models\TenantService;
use Illuminate\Support\Facades\DB;

class IntegrationBillingService
{
    public function __construct(private ExternalBillingApiService $externalApi) {}

    // ── Conteo de documentos ─────────────────────────────────────────────────

    /**
     * Obtiene el conteo de documentos únicos facturables desde la API de la app externa.
     *
     * @param bool|null $includeUnique true: solo documentos enviados una sola vez (excluye reenvíos).
     *                                  false: incluye los reenviados. null: usa el default de la API (true).
     */
    public function countBillableDocuments(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo, ?bool $includeUnique = null): int
    {
        return $this->externalApi->getIntegrationDocuments($tenantId, $departmentId, $periodFrom, $periodTo, $includeUnique)['count'];
    }

    /**
     * Obtiene el conteo y el listado detallado de documentos desde la API externa.
     * Usado por IntegrationBillingController@documents para el detalle previo a facturar.
     */
    public function getDocumentsFromApi(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo, ?bool $includeUnique = null): array
    {
        return $this->externalApi->getIntegrationDocuments($tenantId, $departmentId, $periodFrom, $periodTo, $includeUnique);
    }

    /*
     * [LEGACY — consultas directas a BD, comentado tras migración a API externa]
     *
     * public function countBillableDocuments(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): int
     * {
     *     return DB::table('api_external_sent_documents_ot_files')
     *         ->where('tenant_id', $tenantId)
     *         ->where('department_id', $departmentId)
     *         ->where('sent', 1)
     *         ->where('sync_status', 'sent')
     *         ->where('deleted', 0)
     *         ->whereBetween('date', [$periodFrom, $periodTo])
     *         ->select(['project_id', 'system_integration_name', 'ot_number', 'date', 'report_type'])
     *         ->distinct()
     *         ->get()
     *         ->count();
     * }
     *
     * // Listado detallado de documentos (para vista previa antes de facturar):
     * // DB::table('api_external_sent_documents_ot_files')
     * //     ->where('tenant_id', $tenantId)
     * //     ->where('department_id', $departmentId)
     * //     ->where('sent', 1)
     * //     ->where('sync_status', 'sent')
     * //     ->where('deleted', 0)
     * //     ->whereBetween('date', [$periodFrom, $periodTo])
     * //     ->select(['project_id', 'system_integration_name', 'ot_number', 'date', 'report_type'])
     * //     ->distinct()
     * //     ->orderBy('date')
     * //     ->orderBy('system_integration_name')
     * //     ->orderBy('ot_number')
     * //     ->get();
     */

    // ── Cálculo por assignment ────────────────────────────────────────────────

    /**
     * Precio fijo: conteo de documentos únicos × price del assignment.
     * El precio se toma directamente del campo price en tenant_service_assignments.
     *
     * Se factura con include_unique = true: solo documentos enviados una sola vez
     * (los reenvíos no se cobran).
     */
    public function calculateForAssignment(TenantService $assignment, string $periodFrom, string $periodTo): array
    {
        $count       = $this->countBillableDocuments(
            $assignment->tenant_id,
            $assignment->department_id,
            $periodFrom,
            $periodTo,
            includeUnique: true
        );
        $pricePerDoc = (float) ($assignment->price ?? 0);
        $total       = round($count * $pricePerDoc, 2);

        return [
            'active_licenses_count' => $count,
            'price_per_document'    => $pricePerDoc,
            'total_price'           => $total,
        ];
    }
}
