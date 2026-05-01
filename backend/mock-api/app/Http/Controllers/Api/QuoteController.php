<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\TenantService;
use App\Models\TenantDepartment;
use App\Models\TenantBillingConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        try {
            $q = Quote::with(['tenant', 'department'])
                ->where('deleted', 0);

            if ($s = $request->search) {
                $q->where(function ($query) use ($s) {
                    $query->where('quote_number', 'like', "%{$s}%")
                          ->orWhere('currency',     'like', "%{$s}%")
                          ->orWhere('notes',        'like', "%{$s}%")
                          ->orWhereHas('tenant', fn ($t) =>
                              $t->where('name',  'like', "%{$s}%")
                                ->orWhere('code', 'like', "%{$s}%")
                                ->orWhere('email','like', "%{$s}%")
                          );
                });
            }

            if ($status = $request->status) {
                $q->where('status', $status);
            }

            $stats = Quote::where('deleted', 0)
                ->selectRaw("currency,
                    SUM(total)                                          AS total_quoted,
                    SUM(CASE WHEN status='accepted' THEN total ELSE 0 END) AS total_accepted,
                    SUM(CASE WHEN status IN ('draft','sent') THEN total ELSE 0 END) AS total_pending,
                    SUM(CASE WHEN status='rejected' THEN total ELSE 0 END) AS total_rejected")
                ->groupBy('currency')
                ->get()
                ->mapWithKeys(fn ($row) => [
                    $row->currency => [
                        'total_quoted'   => $row->total_quoted,
                        'total_accepted' => $row->total_accepted,
                        'total_pending'  => $row->total_pending,
                        'total_rejected' => $row->total_rejected,
                    ],
                ]);

            $quotes = $q->orderBy('id', 'desc')->paginate(20);

            return response()->json([
                'data'  => $quotes->items(),
                'stats' => $stats,
                'total' => $quotes->total(),
                'last_page' => $quotes->lastPage(),
                'current_page' => $quotes->currentPage(),
            ]);
        } catch (Throwable $e) {
            Log::error('QuoteController@index: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener cotizaciones'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'tenant_id'           => 'required|exists:tenants,id',
            'department_id'       => 'nullable|exists:tenant_departments,id',
            'issue_date'          => 'required|date',
            'expiry_date'         => 'nullable|date',
            'currency'            => 'required|string|max:10',
            'notes'               => 'nullable|string',
            'items'               => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = collect($request->items)
                ->sum(fn ($i) => $i['quantity'] * $i['unit_price']);

            $quote = Quote::create([
                'quote_number' => $this->generateNumber(),
                'tenant_id'    => $request->tenant_id,
                'department_id'=> $request->department_id,
                'issued_by'    => $request->user()->id,
                'issue_date'   => $request->issue_date,
                'expiry_date'  => $request->expiry_date,
                'status'       => 'draft',
                'subtotal'     => round($subtotal, 2),
                'total'        => round($subtotal, 2),
                'currency'     => $request->currency,
                'notes'        => $request->notes,
            ]);

            foreach ($request->items as $item) {
                QuoteItem::create([
                    'quote_id'          => $quote->id,
                    'tenant_service_id' => $item['tenant_service_id'] ?? null,
                    'service_id'        => $item['service_id'] ?? null,
                    'description'       => $item['description'],
                    'quantity'          => $item['quantity'],
                    'unit'              => $item['unit'] ?? null,
                    'unit_price'        => $item['unit_price'],
                    'total'             => round($item['quantity'] * $item['unit_price'], 2),
                ]);
            }

            DB::commit();

            return response()->json(
                Quote::with(['tenant', 'department', 'items'])->find($quote->id),
                201
            );
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('QuoteController@store: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear la cotización'], 500);
        }
    }

    public function show($id)
    {
        try {
            $quote = Quote::with(['tenant', 'department', 'items'])
                ->where('deleted', 0)
                ->findOrFail($id);

            return response()->json($quote);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Cotización no encontrada'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status'      => 'sometimes|in:draft,sent,accepted,rejected,expired',
            'expiry_date' => 'sometimes|nullable|date',
            'notes'       => 'sometimes|nullable|string',
        ]);

        try {
            $quote = Quote::where('deleted', 0)->findOrFail($id);
            $quote->update($request->only('status', 'expiry_date', 'notes'));
            return response()->json($quote);
        } catch (Throwable $e) {
            Log::error('QuoteController@update: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar la cotización'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $quote = Quote::where('deleted', 0)->findOrFail($id);
            $quote->update(['deleted' => 1]);
            return response()->json(['message' => 'Cotización eliminada']);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Error al eliminar la cotización'], 500);
        }
    }

    public function tenantServices($tenantId)
    {
        try {
            $assignments = TenantService::with(['service', 'tiers'])
                ->where('tenant_id', $tenantId)
                ->where('status', 1)
                ->get();

            $deptIds = $assignments
                ->whereNotNull('department_id')
                ->pluck('department_id')
                ->unique()
                ->values();

            $departments = $deptIds->isNotEmpty()
                ? TenantDepartment::whereIn('id', $deptIds)
                    ->where('status', 1)
                    ->where('deleted', 0)
                    ->orderBy('name')
                    ->get()
                : collect();

            $billingConfig = TenantBillingConfig::where('tenant_id', $tenantId)->first();

            return response()->json([
                'assignments'                => $assignments,
                'departments'                => $departments,
                'has_department_assignments' => $deptIds->isNotEmpty(),
                'currency'                   => $billingConfig?->currency ?? 'CLP',
            ]);
        } catch (Throwable $e) {
            Log::error('QuoteController@tenantServices: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener servicios del cliente'], 500);
        }
    }

    private function generateNumber(): string
    {
        $prefix = 'COT-' . now()->format('Ym') . '-';

        $last = Quote::where('quote_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('quote_number');

        $next = $last ? (int) substr($last, -4) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
