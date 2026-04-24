<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\Service;
use Throwable;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Service::where('deleted', 0);

            if ($request->search) {
                $s = "%{$request->search}%";
                $query->where(function ($q) use ($s) {
                    $q->where('name',        'like', $s)
                      ->orWhere('code',       'like', $s)
                      ->orWhere('description','like', $s)
                      ->orWhere('currency',   'like', $s)
                      ->orWhere('unit',       'like', $s);
                });
            }

            return response()->json(
                $query->orderBy('id', 'asc')->paginate(10)
            );
        } catch (Throwable $e) {
            Log::error('ServiceController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener servicios'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'code'     => 'nullable|string|max:100|unique:services,code',
            'price'    => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'unit'     => 'nullable|string|max:50',
        ]);

        DB::beginTransaction();
        try {
            $service = Service::create($request->all());

            DB::commit();

            return response()->json($service, 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('ServiceController@store: ' . $e->getMessage());

            return response()->json(['message' => 'Error al crear el servicio'], 500);
        }
    }

    public function show($id)
    {
        try {
            $service = Service::where('deleted', 0)->findOrFail($id);

            return response()->json($service);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Servicio no encontrado'], 404);
        } catch (Throwable $e) {
            Log::error('ServiceController@show: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener el servicio'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'code'     => "sometimes|nullable|string|max:100|unique:services,code,{$id}",
            'price'    => 'sometimes|nullable|numeric|min:0',
            'currency' => 'sometimes|nullable|string|max:10',
            'unit'     => 'sometimes|nullable|string|max:50',
        ]);

        DB::beginTransaction();
        try {
            $service = Service::findOrFail($id);
            $service->update($request->all());

            DB::commit();

            return response()->json($service);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Servicio no encontrado'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('ServiceController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al actualizar el servicio'], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $service = Service::findOrFail($id);
            $service->update(['deleted' => 1]);

            DB::commit();

            return response()->json(['success' => true]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Servicio no encontrado'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('ServiceController@destroy: ' . $e->getMessage());

            return response()->json(['message' => 'Error al eliminar el servicio'], 500);
        }
    }
}
