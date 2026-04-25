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
            'description' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $department = TenantDepartment::create([
                'tenant_id'   => $tenantId,
                'name'        => $request->name,
                'code'        => $request->code,
                'description' => $request->description,
                'status'      => 1,
                'deleted'     => 0,
            ]);

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
            'description' => 'nullable|string|max:500',
            'status'      => 'sometimes|in:0,1',
        ]);

        DB::beginTransaction();
        try {
            $department->update($request->only(['name', 'code', 'description', 'status']));
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
}
