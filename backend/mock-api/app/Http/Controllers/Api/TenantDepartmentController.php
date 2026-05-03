<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantDepartment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

class TenantDepartmentController extends Controller
{
    public function index(int $tenantId)
    {
        try {
            Tenant::where('id', $tenantId)->where('deleted', 0)->firstOrFail();

            $departments = TenantDepartment::where('tenant_id', $tenantId)
                ->where('deleted', 0)
                ->orderBy('name')
                ->get();

            return response()->json($departments);
        } catch (Throwable $e) {
            Log::error('TenantDepartmentController@index: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener departamentos'], 500);
        }
    }

    public function store(Request $request, int $tenantId)
    {
        Tenant::where('id', $tenantId)->where('deleted', 0)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tenant_departments')->where(
                    fn ($q) => $q->where('tenant_id', $tenantId)->where('deleted', 0)
                ),
            ],
            'description'            => 'nullable|string|max:500',
            'use_department_billing' => 'boolean',
            'applies_tax'            => 'nullable|boolean',
            'tax_name'               => 'nullable|string|max:50',
            'tax_percent'            => 'nullable|numeric|min:0|max:100',
            'billing_cycle'          => 'nullable|in:monthly,quarterly,biannual,annual',
            'billing_day_from'       => 'nullable|integer|min:1|max:31',
            'billing_day_to'         => 'nullable|integer|min:1|max:31',
            'currency'               => 'nullable|string|size:3',
            'payment_terms_days'     => 'nullable|integer|min:1|max:365',
            'billing_email'          => 'nullable|email|max:255',
            'billing_contact'        => 'nullable|string|max:255',
            'billing_notes'          => 'nullable|string',
        ]);

        if ($request->boolean('use_department_billing')) {
            $this->validateBillingRange($request);
        }

        DB::beginTransaction();
        try {
            $data = [
                'tenant_id'              => $tenantId,
                'name'                   => $request->name,
                'code'                   => $request->code,
                'description'            => $request->description,
                'use_department_billing' => $request->boolean('use_department_billing'),
                'status'                 => 1,
                'deleted'                => 0,
            ];

            if ($request->boolean('use_department_billing')) {
                $data = array_merge($data, $this->extractBillingFields($request));
            }

            $department = TenantDepartment::create($data);

            DB::commit();
            return response()->json($department, 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantDepartmentController@store: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear departamento'], 500);
        }
    }

    public function update(Request $request, int $tenantId, int $id)
    {
        $department = TenantDepartment::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->where('deleted', 0)
            ->firstOrFail();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('tenant_departments')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId)->where('deleted', 0))
                    ->ignore($id),
            ],
            'description'            => 'nullable|string|max:500',
            'status'                 => 'sometimes|in:0,1',
            'use_department_billing' => 'boolean',
            'applies_tax'            => 'nullable|boolean',
            'tax_name'               => 'nullable|string|max:50',
            'tax_percent'            => 'nullable|numeric|min:0|max:100',
            'billing_cycle'          => 'nullable|in:monthly,quarterly,biannual,annual',
            'billing_day_from'       => 'nullable|integer|min:1|max:31',
            'billing_day_to'         => 'nullable|integer|min:1|max:31',
            'currency'               => 'nullable|string|size:3',
            'payment_terms_days'     => 'nullable|integer|min:1|max:365',
            'billing_email'          => 'nullable|email|max:255',
            'billing_contact'        => 'nullable|string|max:255',
            'billing_notes'          => 'nullable|string',
        ]);

        if ($request->boolean('use_department_billing')) {
            $this->validateBillingRange($request);
        }

        DB::beginTransaction();
        try {
            $fields = $request->only(['name', 'code', 'description', 'status', 'use_department_billing']);

            if ($request->has('use_department_billing')) {
                if ($request->boolean('use_department_billing')) {
                    $fields = array_merge($fields, $this->extractBillingFields($request));
                } else {
                    // Limpiar campos de billing al desactivar
                    $fields = array_merge($fields, [
                        'applies_tax'        => null,
                        'tax_name'           => null,
                        'tax_percent'        => null,
                        'billing_cycle'      => null,
                        'billing_day_from'   => null,
                        'billing_day_to'     => null,
                        'currency'           => null,
                        'payment_terms_days' => null,
                        'billing_email'      => null,
                        'billing_contact'    => null,
                        'billing_notes'      => null,
                    ]);
                }
            }

            $department->update($fields);
            DB::commit();
            return response()->json($department->fresh());
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantDepartmentController@update: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar departamento'], 500);
        }
    }

    public function destroy(int $tenantId, int $id)
    {
        $department = TenantDepartment::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->where('deleted', 0)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $department->update(['deleted' => 1]);
            DB::commit();
            return response()->json(['message' => 'Departamento eliminado']);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantDepartmentController@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar departamento'], 500);
        }
    }

    private function validateBillingRange(Request $request): void
    {
        $from = $request->billing_day_from;
        $to   = $request->billing_day_to;

        if ($from && $to) {
            $range = $from <= $to ? $to - $from : 31 - $from + $to;
            if ($range > 30) {
                abort(response()->json(['message' => 'El rango de corte no puede superar los 30 días'], 422));
            }
        }
    }

    private function extractBillingFields(Request $request): array
    {
        return [
            'applies_tax'        => $request->boolean('applies_tax'),
            'tax_name'           => $request->tax_name,
            'tax_percent'        => $request->tax_percent ?? 0,
            'billing_cycle'      => $request->billing_cycle ?? 'monthly',
            'billing_day_from'   => $request->billing_day_from ?? 1,
            'billing_day_to'     => $request->billing_day_to ?? 28,
            'currency'           => $request->currency ?? 'USD',
            'payment_terms_days' => $request->payment_terms_days ?? 30,
            'billing_email'      => $request->billing_email,
            'billing_contact'    => $request->billing_contact,
            'billing_notes'      => $request->billing_notes,
        ];
    }
}
