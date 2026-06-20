<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExternalBillingApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\Tenant;
use Throwable;

class TenantController extends Controller
{
    public function __construct(private ExternalBillingApiService $externalApi) {}

    public function index(Request $request)
    {
        try {
            // Sincronizar desde la API externa (cacheado 5 minutos para no sobrecargar)
            if (! Cache::has('external_tenants_synced')) {
                $external = $this->externalApi->getTenants('all', false);

                if (! empty($external['items'])) {
                    $now  = now()->toDateTimeString();
                    $rows = collect($external['items'])->map(fn ($t) => [
                        'id'         => $t['id'],
                        'name'       => $t['name'],
                        'domain'     => $t['domain'] ?? null,
                        'status'     => $t['status'] ?? 1,
                        'deleted'    => $t['deleted'] ?? 0,
                        'code'       => 'TEN-' . $t['id'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->toArray();

                    Tenant::upsert($rows, ['id'], ['name', 'domain', 'status', 'deleted', 'updated_at']);
                }

                Cache::put('external_tenants_synced', true, 300);
            }
        } catch (Throwable $e) {
            Log::warning('TenantController@index sync: ' . $e->getMessage());
        }

        try {
            $query = Tenant::where('deleted', 0)->withCount([
                'departments as departments_count' => fn ($q) => $q->where('status', 1),
            ]);

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
        return response()->json(['message' => 'Las empresas se gestionan desde EasyNextTime'], 405);
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
        return response()->json(['message' => 'Las empresas se gestionan desde EasyNextTime'], 405);
    }
}
