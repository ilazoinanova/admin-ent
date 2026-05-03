<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantService;
use App\Services\LicenseBillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class LicenseBillingController extends Controller
{
    public function __construct(private LicenseBillingService $billingService) {}

    /**
     * Calcula el monto de licencias activas para un período dado.
     * Obtiene el assignment activo del módulo de asignaciones y aplica su modalidad de precio.
     *
     * GET /api/billing/license-preview
     * Params: tenant_id, department_id (nullable), period_from, period_to
     */
    public function preview(Request $request)
    {
        $request->validate([
            'tenant_id'     => 'required|integer|exists:tenants,id',
            'department_id' => 'nullable|integer|exists:tenant_departments,id',
            'period_from'   => 'required|date',
            'period_to'     => 'required|date|after_or_equal:period_from',
        ]);

        try {
            // Obtener assignments activos con precio por usuario para este tenant/department
            $assignments = TenantService::with(['service', 'tiers' => fn ($q) => $q->where('active', 1)->where('deleted', 0)->orderBy('min_users')])
                ->where('tenant_id', $request->tenant_id)
                ->where('department_id', $request->department_id)
                ->where('status', 1)
                ->where('deleted', 0)
                ->where('unit', 'user')
                ->whereNotNull('license_modalidad')
                ->get();

            if ($assignments->isEmpty()) {
                return response()->json([
                    'message' => 'No hay servicios activos con modalidad de licencia por usuario para este tenant/departamento.',
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
                    'assignment_id'         => $assignment->id,
                    'service_id'            => $assignment->service_id,
                    'service_name'          => $assignment->service?->name,
                    'department_id'         => $assignment->department_id,
                    'license_type'          => $assignment->license_type,
                    'license_modalidad'     => $assignment->license_modalidad,
                    'currency'              => $assignment->currency,
                    'period_from'           => $request->period_from,
                    'period_to'             => $request->period_to,
                    'active_licenses_count' => $calc['active_licenses_count'],
                    'breakdown'             => $calc['breakdown'],
                    'total_price'           => $calc['total_price'],
                    'error'                 => $calc['error'] ?? null,
                ];
            });

            return response()->json(['results' => $results]);
        } catch (Throwable $e) {
            Log::error('LicenseBillingController@preview: ' . $e->getMessage());

            return response()->json(['message' => 'Error al calcular la facturación de licencias'], 500);
        }
    }
}
