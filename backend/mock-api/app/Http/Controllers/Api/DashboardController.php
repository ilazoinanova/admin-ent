<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payable;
use App\Models\PayablePayment;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Throwable;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            $currentPeriod = now()->format('Y-m');

            // Compañías
            $companiesTotal  = Tenant::where('deleted', 0)->count();
            $companiesActive = Tenant::where('deleted', 0)->where('status', 1)->count();

            // Facturas: stats por moneda
            $invoiceStats = Invoice::where('deleted', 0)
                ->selectRaw("currency,
                    SUM(total) as total_invoiced,
                    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
                    SUM(CASE WHEN status IN ('draft','sent') THEN total ELSE 0 END) as total_pending,
                    SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as total_overdue,
                    COUNT(*) as total_count
                ")
                ->groupBy('currency')
                ->get()
                ->keyBy('currency')
                ->map(fn ($r) => [
                    'total_invoiced' => (float) $r->total_invoiced,
                    'total_paid'     => (float) $r->total_paid,
                    'total_pending'  => (float) $r->total_pending,
                    'total_overdue'  => (float) $r->total_overdue,
                    'total_count'    => (int) $r->total_count,
                ]);

            // Distribución de facturas por estado
            $invoiceByStatus = Invoice::where('deleted', 0)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status');

            // Facturación mensual últimos 6 meses por moneda
            $monthlyInvoicing = Invoice::where('deleted', 0)
                ->where('issue_date', '>=', now()->subMonths(5)->startOfMonth())
                ->selectRaw("DATE_FORMAT(issue_date, '%Y-%m') as month, currency, SUM(total) as total")
                ->groupBy('month', 'currency')
                ->orderBy('month')
                ->get();

            // Cuentas por pagar: estado mes actual
            $payableStats = [
                'overdue_count' => PayablePayment::where('deleted', 0)->where('status', 'overdue')->count(),
                'pending_count' => PayablePayment::where('deleted', 0)->where('period', $currentPeriod)->where('status', 'pending')->count(),
                'paid_count'    => PayablePayment::where('deleted', 0)->where('period', $currentPeriod)->where('status', 'paid')->count(),
            ];

            // Montos pendientes/vencidos por moneda
            $pendingPayablesByCurrency = PayablePayment::where('payable_payments.deleted', 0)
                ->whereIn('payable_payments.status', ['pending', 'overdue'])
                ->where('payable_payments.period', $currentPeriod)
                ->join('payables', 'payable_payments.payable_id', '=', 'payables.id')
                ->selectRaw('payables.currency, SUM(payable_payments.amount) as total')
                ->groupBy('payables.currency')
                ->pluck('total', 'currency')
                ->map(fn ($v) => (float) $v);

            // Últimas 5 facturas
            $recentInvoices = Invoice::with('tenant:id,name')
                ->where('deleted', 0)
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get(['id', 'invoice_number', 'tenant_id', 'total', 'currency', 'status', 'issue_date']);

            // Próximos pagos pendientes/vencidos del mes
            $upcomingPayments = PayablePayment::with('payable:id,name,currency')
                ->where('payable_payments.deleted', 0)
                ->whereIn('payable_payments.status', ['pending', 'overdue'])
                ->where('payable_payments.period', $currentPeriod)
                ->orderBy('payable_payments.due_date')
                ->limit(5)
                ->get();

            return response()->json([
                'companies'                  => ['total' => $companiesTotal, 'active' => $companiesActive],
                'invoice_stats'              => $invoiceStats,
                'invoice_by_status'          => $invoiceByStatus,
                'monthly_invoicing'          => $monthlyInvoicing,
                'payable_stats'              => $payableStats,
                'pending_payables_by_currency' => $pendingPayablesByCurrency,
                'recent_invoices'            => $recentInvoices,
                'upcoming_payments'          => $upcomingPayments,
            ]);
        } catch (Throwable $e) {
            Log::error('DashboardController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al cargar el dashboard'], 500);
        }
    }
}
