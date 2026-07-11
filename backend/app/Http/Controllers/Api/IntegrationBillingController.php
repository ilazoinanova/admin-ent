<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ExternalBillingApiException;
use App\Http\Controllers\Controller;
use App\Models\TenantService;
use App\Rules\MaxDateRange;
use App\Services\IntegrationBillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class IntegrationBillingController extends Controller
{
    public function __construct(private IntegrationBillingService $billingService) {}

    /**
     * Calcula documentos únicos facturables para un período.
     * El conteo se obtiene desde la API externa de la app de integraciones.
     *
     * GET /api/billing/integration-preview
     * Params: tenant_id, department_id (nullable), period_from, period_to
     */
    public function preview(Request $request)
    {
        $request->validate([
            'tenant_id'     => 'required|integer|exists:tenants,id',
            'department_id' => 'nullable|integer|exists:tenant_departments,id',
            'period_from'   => 'required|date',
            'period_to'     => ['required', 'date', 'after_or_equal:period_from', new MaxDateRange('period_from', 92)],
        ]);

        try {
            $assignments = TenantService::with('service')
                ->where('tenant_id', $request->tenant_id)
                ->where('department_id', $request->department_id)
                ->where('unit', 'integration')
                ->where('status', 1)
                ->get();

            if ($assignments->isEmpty()) {
                return response()->json([
                    'message' => 'No hay servicios de integración activos para este tenant/departamento.',
                    'results' => [],
                ]);
            }

            $results = $assignments->map(function (TenantService $assignment) use ($request) {
                $calc = $this->billingService->calculateForAssignment(
                    $assignment,
                    $request->period_from,
                    $request->period_to
                );

                return [
                    'assignment_id'      => $assignment->id,
                    'service_id'         => $assignment->service_id,
                    'service_name'       => $assignment->service?->name,
                    'department_id'      => $assignment->department_id,
                    'currency'           => $assignment->currency,
                    'period_from'        => $request->period_from,
                    'period_to'          => $request->period_to,
                    'document_count'     => $calc['active_licenses_count'],
                    'price_per_document' => $calc['price_per_document'],
                    'total_price'        => $calc['total_price'],
                ];
            });

            return response()->json(['results' => $results]);
        } catch (ExternalBillingApiException $e) {
            Log::error('IntegrationBillingController@preview: ' . $e->getMessage());

            return $this->externalBillingErrorResponse($e);
        } catch (Throwable $e) {
            Log::error('IntegrationBillingController@preview: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error al calcular la facturación de integraciones: ' . $e->getMessage(),
            ], 503);
        }
    }

    /**
     * Retorna el listado deduplicado de documentos facturables para un período.
     * El detalle se obtiene desde la API externa de la app de integraciones.
     *
     * GET /api/billing/integration-documents
     * Params: tenant_id, department_id (nullable), period_from, period_to, include_unique (nullable)
     *
     * include_unique: true (default) = solo documentos enviados una sola vez (excluye reenvíos);
     * false = incluye los reenviados (cada documento se cuenta una vez).
     */
    public function documents(Request $request)
    {
        $request->validate([
            'tenant_id'      => 'required|integer|exists:tenants,id',
            'department_id'  => 'nullable|integer',
            'period_from'    => 'required|date',
            'period_to'      => ['required', 'date', 'after_or_equal:period_from', new MaxDateRange('period_from', 92)],
            'include_unique' => 'nullable|boolean',
        ]);

        try {
            $result = $this->billingService->getDocumentsFromApi(
                (int) $request->tenant_id,
                $request->department_id ? (int) $request->department_id : null,
                $request->period_from,
                $request->period_to,
                $request->has('include_unique') ? $request->boolean('include_unique') : true
            );

            return response()->json([
                'documents' => $result['documents'],
                'total'     => $result['count'],
            ]);

            /*
             * [LEGACY — consulta directa a BD, comentado tras migración a API externa]
             *
             * $docs = DB::table('api_external_sent_documents_ot_files')
             *     ->where('tenant_id', $request->tenant_id)
             *     ->where('department_id', $request->department_id)
             *     ->where('sent', 1)
             *     ->where('sync_status', 'sent')
             *     ->where('deleted', 0)
             *     ->whereBetween('date', [$request->period_from, $request->period_to])
             *     ->select(['project_id', 'system_integration_name', 'ot_number', 'date', 'report_type'])
             *     ->distinct()
             *     ->orderBy('date')
             *     ->orderBy('system_integration_name')
             *     ->orderBy('ot_number')
             *     ->get();
             *
             * return response()->json([
             *     'documents' => $docs,
             *     'total'     => $docs->count(),
             * ]);
             */
        } catch (ExternalBillingApiException $e) {
            Log::error('IntegrationBillingController@documents: ' . $e->getMessage());

            return $this->externalBillingErrorResponse($e);
        } catch (Throwable $e) {
            Log::error('IntegrationBillingController@documents: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error al obtener el listado de documentos: ' . $e->getMessage(),
            ], 503);
        }
    }
}
