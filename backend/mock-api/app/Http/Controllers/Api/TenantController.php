<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\Tenant;
use Throwable;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Tenant::where('deleted', 0);

            if ($request->search) {
                $s = "%{$request->search}%";
                $query->where(function ($q) use ($s) {
                    $q->where('name',    'like', $s)
                      ->orWhere('code',   'like', $s)
                      ->orWhere('email',  'like', $s)
                      ->orWhere('domain', 'like', $s)
                      ->orWhere('phone',  'like', $s)
                      ->orWhere('country','like', $s)
                      ->orWhere('city',   'like', $s);
                });
            }

            if ($request->status !== null) {
                $query->where('status', $request->status);
            }

            if ($request->sort_by) {
                $query->orderBy($request->sort_by, $request->sort_order ?? 'asc');
            } else {
                $query->orderBy('id', 'desc');
            }

            return response()->json($query->paginate(10));
        } catch (Throwable $e) {
            Log::error('TenantController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener compañías'], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'code'  => 'required|string|max:100|unique:tenants,code',
            'email' => 'nullable|email',
        ]);

        DB::beginTransaction();
        try {
            $tenant = Tenant::create($validated + $request->all());

            DB::commit();

            return response()->json($tenant, 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantController@store: ' . $e->getMessage());

            return response()->json(['message' => 'Error al crear la compañía'], 500);
        }
    }

    public function show($id)
    {
        try {
            $tenant = Tenant::where('deleted', 0)->findOrFail($id);

            return response()->json($tenant);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Compañía no encontrada'], 404);
        } catch (Throwable $e) {
            Log::error('TenantController@show: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener la compañía'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'code'  => "required|string|max:100|unique:tenants,code,{$id}",
            'email' => 'nullable|email',
        ]);

        DB::beginTransaction();
        try {
            $tenant = Tenant::findOrFail($id);
            $tenant->update($validated + $request->all());

            DB::commit();

            return response()->json($tenant);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Compañía no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al actualizar la compañía'], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $tenant = Tenant::findOrFail($id);
            $tenant->update(['deleted' => 1]);

            DB::commit();

            return response()->json(['success' => true]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Compañía no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('TenantController@destroy: ' . $e->getMessage());

            return response()->json(['message' => 'Error al eliminar la compañía'], 500);
        }
    }
}
