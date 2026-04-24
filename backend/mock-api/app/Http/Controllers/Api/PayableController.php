<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payable;
use App\Models\PayablePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Throwable;

class PayableController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Payable::where('deleted', 0);

            if ($request->search) {
                $s = "%{$request->search}%";
                $query->where(function ($q) use ($s) {
                    $q->where('name',     'like', $s)
                      ->orWhere('vendor',  'like', $s)
                      ->orWhere('category','like', $s)
                      ->orWhere('currency','like', $s)
                      ->orWhere('notes',   'like', $s);
                });
            }

            if ($request->category) {
                $query->where('category', $request->category);
            }

            if ($request->status !== null && $request->status !== '') {
                $query->where('status', $request->status);
            }

            $currentPeriod = now()->format('Y-m');

            $payables = $query->with(['payments' => function ($q) use ($currentPeriod) {
                $q->where('period', $currentPeriod)->where('deleted', 0);
            }])->orderBy('name')->paginate(20);

            $monthlyRaw = Payable::where('deleted', 0)->where('status', 1)->where('frequency', 'monthly')
                ->selectRaw('currency, SUM(amount) as total_monthly')
                ->groupBy('currency')
                ->get()
                ->keyBy('currency');

            $paymentsRaw = PayablePayment::where('payable_payments.deleted', 0)
                ->join('payables', 'payable_payments.payable_id', '=', 'payables.id')
                ->selectRaw("payables.currency,
                    SUM(CASE WHEN payable_payments.period = ? AND payable_payments.status = 'paid' THEN payable_payments.amount_paid ELSE 0 END) as paid_this_month,
                    SUM(CASE WHEN payable_payments.period = ? AND payable_payments.status = 'pending' THEN payable_payments.amount ELSE 0 END) as pending_amount,
                    SUM(CASE WHEN payable_payments.status = 'overdue' THEN payable_payments.amount ELSE 0 END) as overdue_amount
                ", [$currentPeriod, $currentPeriod])
                ->groupBy('payables.currency')
                ->get()
                ->keyBy('currency');

            $currencies = $monthlyRaw->keys()->merge($paymentsRaw->keys())->unique();

            $stats = $currencies->mapWithKeys(fn ($cur) => [
                $cur => [
                    'total_monthly'   => (float) ($monthlyRaw[$cur]->total_monthly   ?? 0),
                    'paid_this_month' => (float) ($paymentsRaw[$cur]->paid_this_month ?? 0),
                    'pending_amount'  => (float) ($paymentsRaw[$cur]->pending_amount  ?? 0),
                    'overdue_amount'  => (float) ($paymentsRaw[$cur]->overdue_amount  ?? 0),
                ],
            ]);

            return response()->json([
                ...$payables->toArray(),
                'stats' => $stats,
            ]);
        } catch (Throwable $e) {
            Log::error('PayableController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener cuentas por pagar'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'category'   => 'required|string|max:100',
            'vendor'     => 'nullable|string|max:255',
            'amount'     => 'required|numeric|min:0',
            'currency'   => 'required|string|max:10',
            'frequency'  => 'required|in:monthly,quarterly,annual,one_time',
            'due_day'    => 'required|integer|min:1|max:31',
            'start_date' => 'required|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'notes'      => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $payable = Payable::create([
                'name'       => $request->name,
                'category'   => $request->category,
                'vendor'     => $request->vendor,
                'amount'     => $request->amount,
                'currency'   => $request->currency,
                'frequency'  => $request->frequency,
                'due_day'    => $request->due_day,
                'start_date' => $request->start_date,
                'end_date'   => $request->end_date,
                'status'     => 1,
                'notes'      => $request->notes,
            ]);

            DB::commit();

            return response()->json($payable, 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PayableController@store: ' . $e->getMessage());

            return response()->json(['message' => 'Error al crear la cuenta'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'       => 'sometimes|required|string|max:255',
            'category'   => 'sometimes|required|string|max:100',
            'vendor'     => 'nullable|string|max:255',
            'amount'     => 'sometimes|required|numeric|min:0',
            'currency'   => 'sometimes|required|string|max:10',
            'frequency'  => 'sometimes|required|in:monthly,quarterly,annual,one_time',
            'due_day'    => 'sometimes|required|integer|min:1|max:31',
            'start_date' => 'sometimes|required|date',
            'end_date'   => 'nullable|date',
            'status'     => 'sometimes|in:0,1',
            'notes'      => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $payable = Payable::where('deleted', 0)->findOrFail($id);
            $payable->update($request->only([
                'name', 'category', 'vendor', 'amount', 'currency',
                'frequency', 'due_day', 'start_date', 'end_date', 'status', 'notes',
            ]));

            DB::commit();

            return response()->json($payable);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Cuenta no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PayableController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al actualizar la cuenta'], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $payable = Payable::where('deleted', 0)->findOrFail($id);
            $payable->update(['deleted' => 1]);

            DB::commit();

            return response()->json(['message' => 'Cuenta eliminada']);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Cuenta no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PayableController@destroy: ' . $e->getMessage());

            return response()->json(['message' => 'Error al eliminar la cuenta'], 500);
        }
    }
}
