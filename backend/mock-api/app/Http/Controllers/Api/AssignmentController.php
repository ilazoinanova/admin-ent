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
use Throwable;

class AssignmentController extends Controller
{
    public function index()
    {
        try {
            $tenants     = Tenant::where('status', 1)->get();
            $services    = Service::where('status', 1)->get();
            $assignments = TenantService::with('tiers')->get();

            return response()->json([
                'tenants'     => $tenants,
                'services'    => $services,
                'assignments' => $assignments,
            ]);
        } catch (Throwable $e) {
            Log::error('AssignmentController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener asignaciones'], 500);
        }
    }

    public function toggle(Request $request)
    {
        $request->validate([
            'tenant_id'  => 'required|integer|exists:tenants,id',
            'service_id' => 'required|integer|exists:services,id',
            'status'     => 'required|in:0,1',
        ]);

        DB::beginTransaction();
        try {
            $record = TenantService::updateOrCreate(
                [
                    'tenant_id'  => $request->tenant_id,
                    'service_id' => $request->service_id,
                ],
                [
                    'status' => $request->status,
                ]
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
            'currency'          => 'required|string|max:10',
            'billing_cycle'     => 'required|string',
            'price'             => 'nullable|numeric|min:0',
            'license_type'      => 'nullable|string',
            'license_modalidad' => 'nullable|string|in:fixed,tiered_fixed,tiered_escalating',
            'development_type'  => 'nullable|string|in:unico,bolsa_horas',
            'hours_total'       => 'nullable|numeric|min:0',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'tiers'             => 'nullable|array',
            'tiers.*.min'       => 'required_with:tiers|integer|min:1',
            'tiers.*.max'       => 'required_with:tiers|integer|min:1',
            'tiers.*.price'     => 'required_with:tiers|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $record = TenantService::updateOrCreate(
                [
                    'tenant_id'  => $request->tenant_id,
                    'service_id' => $request->service_id,
                ],
                [
                    'license_type'      => $request->license_type,
                    'license_modalidad' => $request->license_modalidad,
                    'price'             => $request->price,
                    'currency'          => $request->currency,
                    'unit'              => $request->unit,
                    'billing_cycle'     => $request->billing_cycle,
                    'development_type'  => $request->development_type,
                    'hours_total'       => $request->hours_total,
                    'hours_used'        => $request->hours_used,
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
