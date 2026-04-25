<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\TenantService;
use App\Models\TenantServiceTier;
use App\Models\TenantDepartment;
use App\Models\TenantBillingConfig;
use Throwable;

class AssignmentController extends Controller
{
    // tenant_service_assignments.billing_cycle usa valores en español (ENUM existente)
    // tenant_billing_configs.billing_cycle usa valores en inglés
    private function mapCycle(?string $cycle): ?string
    {
        return match ($cycle) {
            'monthly'   => 'mensual',
            'quarterly' => 'trimestral',
            'biannual'  => 'semestral',
            'annual'    => 'anual',
            default     => null,
        };
    }

    public function index()
    {
        try {
            $tenants     = Tenant::where('status', 1)->where('deleted', 0)->get();
            $services    = Service::where('status', 1)->where('deleted', 0)->get();
            $assignments = TenantService::with('tiers')->get();
            $departments = TenantDepartment::where('deleted', 0)
                ->where('status', 1)
                ->orderBy('name')
                ->get();

            // Configs de facturación indexadas por tenant_id
            $billingConfigs = TenantBillingConfig::whereIn('tenant_id', $tenants->pluck('id'))
                ->get()
                ->keyBy('tenant_id');

            return response()->json([
                'tenants'         => $tenants,
                'services'        => $services,
                'assignments'     => $assignments,
                'departments'     => $departments,
                'billing_configs' => $billingConfigs,
            ]);
        } catch (Throwable $e) {
            Log::error('AssignmentController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener asignaciones'], 500);
        }
    }

    public function toggle(Request $request)
    {
        $request->validate([
            'tenant_id'     => 'required|integer|exists:tenants,id',
            'service_id'    => 'required|integer|exists:services,id',
            'department_id' => 'nullable|integer|exists:tenant_departments,id',
            'status'        => 'required|in:0,1',
        ]);

        DB::beginTransaction();
        try {
            // Al activar, poblar currency y billing_cycle desde la config del tenant
            $extraData = ['status' => $request->status];

            if ($request->status == 1) {
                $billingConfig = TenantBillingConfig::where('tenant_id', $request->tenant_id)->first();
                if ($billingConfig) {
                    $extraData['currency']      = $billingConfig->currency;
                    $extraData['billing_cycle'] = $this->mapCycle($billingConfig->billing_cycle);
                }
            }

            $record = TenantService::updateOrCreate(
                [
                    'tenant_id'     => $request->tenant_id,
                    'service_id'    => $request->service_id,
                    'department_id' => $request->department_id,
                ],
                $extraData
            );

            DB::commit();

            return response()->json($record);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('AssignmentController@toggle: ' . $e->getMessage());

            return response()->json(['message' => 'Error al cambiar estado de asignación'], 500);
        }
    }

    public function update(Request $request)
    {
        $request->validate([
            'tenant_id'         => 'required|integer|exists:tenants,id',
            'service_id'        => 'required|integer|exists:services,id',
            'department_id'     => 'nullable|integer|exists:tenant_departments,id',
            'price'             => 'nullable|numeric|min:0',
            'unit'              => 'nullable|string|max:50',
            'license_type'      => 'nullable|string|max:100',
            'license_modalidad' => 'nullable|string|in:fixed,tiered_fixed,tiered_escalating',
            'development_type'  => 'nullable|string|in:unico,bolsa_horas',
            'hours_total'       => 'nullable|numeric|min:0',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date',
            'tiers'             => 'nullable|array',
            'tiers.*.min'       => 'required_with:tiers|integer|min:1',
            'tiers.*.max'       => 'required_with:tiers|integer|min:1',
            'tiers.*.price'     => 'required_with:tiers|numeric|min:0',
        ]);

        // currency y billing_cycle siempre vienen de la config de facturación del tenant
        $billingConfig = TenantBillingConfig::where('tenant_id', $request->tenant_id)->first();

        DB::beginTransaction();
        try {
            $record = TenantService::updateOrCreate(
                [
                    'tenant_id'     => $request->tenant_id,
                    'service_id'    => $request->service_id,
                    'department_id' => $request->department_id,
                ],
                [
                    'license_type'      => $request->license_type,
                    'license_modalidad' => $request->license_modalidad,
                    'price'             => $request->price,
                    'currency'          => $billingConfig?->currency,
                    'billing_cycle'     => $this->mapCycle($billingConfig?->billing_cycle),
                    'unit'              => $request->unit,
                    'development_type'  => $request->development_type,
                    'hours_total'       => $request->hours_total,
                    'start_date'        => $request->start_date,
                    'end_date'          => $request->end_date,
                    'status'            => 1,
                ]
            );

            $record->tiers()->delete();

            if (in_array($request->license_modalidad, ['tiered_fixed', 'tiered_escalating']) && $request->tiers) {
                foreach ($request->tiers as $tier) {
                    $record->tiers()->create([
                        'min_users'      => $tier['min'],
                        'max_users'      => $tier['max'],
                        'price_per_user' => $tier['price'],
                    ]);
                }
            }

            DB::commit();

            return response()->json($record->load('tiers'));
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('AssignmentController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al guardar la asignación'], 500);
        }
    }
}
