<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\TenantService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Throwable;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Invoice::with(['tenant', 'items'])
                ->where('deleted', 0);

            if ($request->search) {
                $s = "%{$request->search}%";
                $query->where(function ($q) use ($s) {
                    $q->where('invoice_number', 'like', $s)
                      ->orWhere('status',        'like', $s)
                      ->orWhere('currency',       'like', $s)
                      ->orWhere('notes',          'like', $s)
                      ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', $s)
                          ->orWhere('code', 'like', $s)
                          ->orWhere('email', 'like', $s));
                });
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->tenant_id) {
                $query->where('tenant_id', $request->tenant_id);
            }

            $invoices = $query->orderBy('id', 'desc')->paginate(20);

            $statsRaw = Invoice::where('deleted', 0)
                ->selectRaw("currency,
                    SUM(total) as total_invoiced,
                    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
                    SUM(CASE WHEN status IN ('draft','sent') THEN total ELSE 0 END) as total_pending,
                    SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as total_overdue
                ")
                ->groupBy('currency')
                ->get();

            $stats = $statsRaw->mapWithKeys(fn ($row) => [
                $row->currency => [
                    'total_invoiced' => (float) $row->total_invoiced,
                    'total_paid'     => (float) $row->total_paid,
                    'total_pending'  => (float) $row->total_pending,
                    'total_overdue'  => (float) $row->total_overdue,
                ],
            ]);

            return response()->json([
                ...$invoices->toArray(),
                'stats' => $stats,
            ]);
        } catch (Throwable $e) {
            Log::error('InvoiceController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener facturas'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'tenant_id'           => 'required|exists:tenants,id',
            'issue_date'          => 'required|date',
            'due_date'            => 'nullable|date',
            'tax_rate'            => 'required|numeric|min:0',
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

            $tax   = round($subtotal * ($request->tax_rate / 100), 2);
            $total = round($subtotal + $tax, 2);

            $invoice = Invoice::create([
                'invoice_number' => $this->generateNumber(),
                'tenant_id'      => $request->tenant_id,
                'issued_by'      => $request->user()->id,
                'issue_date'     => $request->issue_date,
                'due_date'       => $request->due_date,
                'status'         => 'draft',
                'subtotal'       => round($subtotal, 2),
                'tax_rate'       => $request->tax_rate,
                'tax'            => $tax,
                'total'          => $total,
                'currency'       => $request->currency,
                'notes'          => $request->notes,
            ]);

            foreach ($request->items as $item) {
                InvoiceItem::create([
                    'invoice_id'        => $invoice->id,
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

            return response()->json($invoice->load(['tenant', 'items.service']), 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('InvoiceController@store: ' . $e->getMessage());

            return response()->json(['message' => 'Error al crear la factura'], 500);
        }
    }

    public function show($id)
    {
        try {
            $invoice = Invoice::with(['tenant', 'items.service', 'issuedBy'])
                ->where('deleted', 0)
                ->findOrFail($id);

            return response()->json($invoice);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        } catch (Throwable $e) {
            Log::error('InvoiceController@show: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener la factura'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status'   => 'sometimes|in:draft,sent,paid,overdue,cancelled',
            'due_date' => 'sometimes|nullable|date',
            'notes'    => 'sometimes|nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $invoice = Invoice::where('deleted', 0)->findOrFail($id);
            $invoice->update($request->only(['status', 'due_date', 'notes']));

            DB::commit();

            return response()->json($invoice->load(['tenant', 'items.service']));
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Factura no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('InvoiceController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al actualizar la factura'], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $invoice = Invoice::where('deleted', 0)->findOrFail($id);
            $invoice->update(['deleted' => 1]);

            DB::commit();

            return response()->json(['message' => 'Factura eliminada']);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Factura no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('InvoiceController@destroy: ' . $e->getMessage());

            return response()->json(['message' => 'Error al eliminar la factura'], 500);
        }
    }

    public function tenantServices($tenantId)
    {
        try {
            $assignments = TenantService::with(['service', 'tiers'])
                ->where('tenant_id', $tenantId)
                ->where('status', 1)
                ->get();

            return response()->json($assignments);
        } catch (Throwable $e) {
            Log::error('InvoiceController@tenantServices: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener servicios del cliente'], 500);
        }
    }

    private function generateNumber(): string
    {
        $prefix = 'FAC-' . now()->format('Ym') . '-';

        $last = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('invoice_number');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
