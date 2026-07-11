<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Tenant;
use App\Models\TenantService;
use App\Models\TenantDepartment;
use App\Models\TenantBillingConfig;
use Illuminate\Http\Request;
use App\Mail\InvoiceClientMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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

            if ($request->billing_period) {
                $query->where('billing_period', $request->billing_period);
            }

            $invoices = $query->orderBy('id', 'desc')->paginate(20);

            $statsQuery = Invoice::where('deleted', 0);
            if ($request->tenant_id) {
                $statsQuery->where('tenant_id', $request->tenant_id);
            }
            if ($request->billing_period) {
                $statsQuery->where('billing_period', $request->billing_period);
            }

            $statsRaw = $statsQuery
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
            'department_id'       => 'nullable|exists:tenant_departments,id',
            'billing_period'      => 'required|string|max:7',
            'period_from'         => 'required|date',
            'period_to'           => 'required|date',
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
                'department_id'  => $request->department_id,
                'billing_period' => $request->billing_period,
                'period_from'    => $request->period_from,
                'period_to'      => $request->period_to,
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
        DB::beginTransaction();
        try {
            $invoice = Invoice::where('deleted', 0)->findOrFail($id);

            // Edición completa (solo borradores)
            if ($request->has('items')) {
                if ($invoice->status !== 'draft') {
                    DB::rollBack();
                    return response()->json(['message' => 'Solo se pueden editar facturas en estado borrador'], 422);
                }

                $request->validate([
                    'billing_period'      => 'sometimes|string|max:7',
                    'period_from'         => 'sometimes|nullable|date',
                    'period_to'           => 'sometimes|nullable|date',
                    'issue_date'          => 'sometimes|date',
                    'due_date'            => 'nullable|date',
                    'tax_rate'            => 'sometimes|numeric|min:0',
                    'tax_name'            => 'nullable|string|max:50',
                    'currency'            => 'sometimes|string|max:10',
                    'notes'               => 'nullable|string',
                    'items'               => 'required|array|min:1',
                    'items.*.description' => 'required|string',
                    'items.*.quantity'    => 'required|numeric|min:0.01',
                    'items.*.unit_price'  => 'required|numeric|min:0',
                ]);

                $taxRate  = (float) $request->input('tax_rate', $invoice->tax_rate);
                $subtotal = collect($request->items)->sum(fn ($i) => $i['quantity'] * $i['unit_price']);
                $tax      = round($subtotal * ($taxRate / 100), 2);
                $total    = round($subtotal + $tax, 2);

                $invoice->update([
                    'billing_period' => $request->input('billing_period', $invoice->billing_period),
                    'period_from'    => $request->input('period_from',    $invoice->period_from),
                    'period_to'      => $request->input('period_to',      $invoice->period_to),
                    'issue_date'     => $request->input('issue_date',     $invoice->issue_date),
                    'due_date'       => $request->input('due_date',       $invoice->due_date),
                    'tax_rate'       => $taxRate,
                    'tax_name'       => $request->input('tax_name',       $invoice->tax_name),
                    'subtotal'       => round($subtotal, 2),
                    'tax'            => $tax,
                    'total'          => $total,
                    'currency'       => $request->input('currency',       $invoice->currency),
                    'notes'          => $request->input('notes',          $invoice->notes),
                ]);

                // Reemplazar ítems
                InvoiceItem::where('invoice_id', $invoice->id)->delete();
                foreach ($request->items as $item) {
                    InvoiceItem::create([
                        'invoice_id'        => $invoice->id,
                        'tenant_service_id' => $item['tenant_service_id'] ?? null,
                        'service_id'        => $item['service_id']        ?? null,
                        'description'       => $item['description'],
                        'quantity'          => $item['quantity'],
                        'unit'              => $item['unit']              ?? null,
                        'unit_price'        => $item['unit_price'],
                        'total'             => round($item['quantity'] * $item['unit_price'], 2),
                    ]);
                }
            } else {
                // Actualización simple de estado/campos
                $request->validate([
                    'status'                   => 'sometimes|in:draft,accounting,ready,sent,paid,overdue,cancelled',
                    'due_date'                 => 'sometimes|nullable|date',
                    'notes'                    => 'sometimes|nullable|string',
                    'qr_url'                   => 'sometimes|nullable|url|max:2048',
                    'accounting_email_to'      => 'sometimes|nullable|email|max:255',
                    'accounting_email_subject' => 'sometimes|nullable|string|max:500',
                ]);

                $fields = $request->only(['status', 'due_date', 'notes', 'qr_url',
                                          'accounting_email_to', 'accounting_email_subject']);

                if ($request->input('status') === 'accounting') {
                    $fields['accounting_sent_at'] = now();
                }

                $invoice->update($fields);
            }

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

            // IDs de departamentos que tienen asignaciones activas para este tenant
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

            $hasDepartmentAssignments = $deptIds->isNotEmpty();

            $billingConfig = TenantBillingConfig::where('tenant_id', $tenantId)->first();

            // Último período facturado general (sin departamento)
            $lastGeneralPeriod = Invoice::where('tenant_id', $tenantId)
                ->whereNull('department_id')
                ->where('deleted', 0)
                ->whereNotNull('billing_period')
                ->orderBy('billing_period', 'desc')
                ->value('billing_period');

            // Último período facturado por departamento
            $deptLastPeriods = $deptIds->isNotEmpty()
                ? Invoice::where('tenant_id', $tenantId)
                    ->whereIn('department_id', $deptIds)
                    ->where('deleted', 0)
                    ->whereNotNull('billing_period')
                    ->selectRaw('department_id, MAX(billing_period) as last_period')
                    ->groupBy('department_id')
                    ->pluck('last_period', 'department_id')
                : collect();

            // Inyectar last_billed_period en cada departamento
            $departments = $departments->map(function ($dept) use ($deptLastPeriods) {
                $dept->last_billed_period = $deptLastPeriods[$dept->id] ?? null;
                return $dept;
            });

            return response()->json([
                'assignments'                => $assignments,
                'departments'                => $departments,
                'has_department_assignments' => $hasDepartmentAssignments,
                'currency'                   => $billingConfig?->currency ?? 'CLP',
                'tax_percent'                => ($billingConfig?->applies_tax)
                    ? (float) ($billingConfig->tax_percent ?? 0)
                    : 0,
                'tax_name'                   => ($billingConfig?->applies_tax)
                    ? ($billingConfig->tax_name ?? 'IVA')
                    : null,
                'billing_day_from'           => $billingConfig?->billing_day_from   ?? 1,
                'billing_day_to'             => $billingConfig?->billing_day_to     ?? 28,
                'payment_terms_days'         => $billingConfig?->payment_terms_days ?? 30,
                'last_billed_period'         => $lastGeneralPeriod,
            ]);
        } catch (Throwable $e) {
            Log::error('InvoiceController@tenantServices: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener servicios del cliente'], 500);
        }
    }

    public function uploadFiscalPdf(Request $request, $id)
    {
        $request->validate([
            'fiscal_pdf' => 'required|file|mimes:pdf|max:20480',
        ]);

        try {
            $invoice = Invoice::where('deleted', 0)->findOrFail($id);

            $path         = $request->file('fiscal_pdf')->store('invoices/fiscal', 'public');
            $downloadUrl  = url("/fiscal/{$invoice->id}/download");

            $invoice->update([
                'fiscal_pdf_url' => $path,
                'qr_url'         => $downloadUrl,
                'status'         => 'ready',
            ]);

            return response()->json($invoice->load(['tenant', 'items.service']));
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        } catch (Throwable $e) {
            Log::error('InvoiceController@uploadFiscalPdf: ' . $e->getMessage());

            return response()->json(['message' => 'Error al subir el archivo'], 500);
        }
    }

    public function tenantsWithInvoices()
    {
        try {
            $tenantIds = Invoice::where('deleted', 0)->distinct()->pluck('tenant_id');

            $tenants = Tenant::whereIn('id', $tenantIds)
                ->orderBy('name')
                ->get(['id', 'name']);

            return response()->json(['data' => $tenants]);
        } catch (Throwable $e) {
            Log::error('InvoiceController@tenantsWithInvoices: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener clientes'], 500);
        }
    }

    public function billingPeriods(Request $request)
    {
        $request->validate(['tenant_id' => 'nullable|integer|exists:tenants,id']);

        try {
            $query = Invoice::where('deleted', 0)->whereNotNull('billing_period');

            if ($request->tenant_id) {
                $query->where('tenant_id', $request->tenant_id);
            }

            $periods = $query->orderBy('billing_period', 'desc')->distinct()->pluck('billing_period');

            return response()->json(['data' => $periods]);
        } catch (Throwable $e) {
            Log::error('InvoiceController@billingPeriods: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener períodos'], 500);
        }
    }

    public function sendToClient(Request $request, $id)
    {
        $request->validate([
            'pdf'           => 'required|file|mimes:pdf|max:20480',
            'email_to'      => 'required|email|max:255',
            'email_cc'      => 'nullable|email|max:255',
            'email_subject' => 'required|string|max:500',
            'email_body'    => 'required|string',
            'email_footer'  => 'nullable|string',
        ]);

        try {
            $invoice = Invoice::with(['tenant', 'items.service'])
                ->where('deleted', 0)
                ->findOrFail($id);

            $pdfFile  = $request->file('pdf');
            $fileName = $invoice->invoice_number . '.pdf';

            $mailable = new InvoiceClientMail(
                invoice:      $invoice,
                emailSubject: $request->email_subject,
                emailBody:    $request->email_body,
                emailFooter:  $request->email_footer ?? '',
                pdfPath:      $pdfFile->getRealPath(),
                pdfFileName:  $fileName,
            );

            $mailer = Mail::to($request->email_to);
            if ($request->filled('email_cc')) {
                $mailer->cc($request->email_cc);
            }
            $mailer->send($mailable);

            $invoice->update([
                'status'          => 'sent',
                'client_email_to' => $request->email_to,
                'client_email_cc' => $request->email_cc ?: null,
                'client_sent_at'  => now(),
            ]);

            return response()->json($invoice->load(['tenant', 'items.service']));
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        } catch (Throwable $e) {
            Log::error('InvoiceController@sendToClient: ' . $e->getMessage());

            return response()->json(['message' => 'Error al enviar el correo al cliente'], 500);
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
