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

class PayablePaymentController extends Controller
{
    public function index($payableId)
    {
        try {
            $payable = Payable::where('deleted', 0)->findOrFail($payableId);

            $payments = PayablePayment::where('payable_id', $payableId)
                ->where('deleted', 0)
                ->orderBy('period', 'desc')
                ->get();

            return response()->json([
                'payable'  => $payable,
                'payments' => $payments,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Cuenta no encontrada'], 404);
        } catch (Throwable $e) {
            Log::error('PayablePaymentController@index: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener historial de pagos'], 500);
        }
    }

    public function store(Request $request, $payableId)
    {
        $request->validate([
            'period'    => 'required|string|size:7',   // "2026-04"
            'due_date'  => 'required|date',
            'amount'    => 'required|numeric|min:0',
            'reference' => 'nullable|string|max:100',
            'notes'     => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $payable = Payable::where('deleted', 0)->findOrFail($payableId);

            $payment = PayablePayment::create([
                'payable_id' => $payable->id,
                'period'     => $request->period,
                'due_date'   => $request->due_date,
                'amount'     => $request->amount,
                'status'     => 'pending',
                'reference'  => $request->reference,
                'notes'      => $request->notes,
            ]);

            DB::commit();

            return response()->json($payment, 201);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Cuenta no encontrada'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PayablePaymentController@store: ' . $e->getMessage());

            return response()->json(['message' => 'Error al registrar pago'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status'      => 'sometimes|in:pending,paid,overdue',
            'amount_paid' => 'nullable|numeric|min:0',
            'paid_at'     => 'nullable|date',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $payment = PayablePayment::where('deleted', 0)->findOrFail($id);

            $data = $request->only(['status', 'amount_paid', 'paid_at', 'reference', 'notes']);

            // Si se marca como pagado y no se especifica monto pagado, usar el monto de la cuenta
            if (($data['status'] ?? null) === 'paid' && empty($data['amount_paid'])) {
                $data['amount_paid'] = $payment->amount;
            }

            if (($data['status'] ?? null) === 'paid' && empty($data['paid_at'])) {
                $data['paid_at'] = now()->toDateString();
            }

            $payment->update($data);

            DB::commit();

            return response()->json($payment);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Pago no encontrado'], 404);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PayablePaymentController@update: ' . $e->getMessage());

            return response()->json(['message' => 'Error al actualizar pago'], 500);
        }
    }
}
