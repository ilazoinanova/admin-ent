<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payable;
use App\Models\PayablePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Throwable;

class PayablePaymentController extends Controller
{
    public function indexAll(Request $request)
    {
        try {
            $query = PayablePayment::with('payable:id,name,vendor,currency,category,frequency,due_day,amount,notes')
                ->where('payable_payments.deleted', 0)
                ->whereHas('payable', fn ($q) => $q->where('deleted', 0));

            if ($search = $request->input('search')) {
                $query->whereHas('payable', function ($q) use ($search) {
                    $q->where('name',   'like', "%{$search}%")
                      ->orWhere('vendor', 'like', "%{$search}%");
                });
            }

            if ($period = $request->input('period')) {
                $query->where('period', $period);
            }

            $payments = $query->orderBy('period', 'desc')->orderBy('due_date', 'asc')->paginate(25);

            return response()->json($payments);
        } catch (Throwable $e) {
            Log::error('PayablePaymentController@indexAll: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener pagos'], 500);
        }
    }

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
            'period'      => 'required|string|size:7',
            'due_date'    => 'required|date',
            'amount'      => 'required|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'paid_at'     => 'nullable|date',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'comprobante' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png,webp',
        ]);

        DB::beginTransaction();
        try {
            $payable = Payable::where('deleted', 0)->findOrFail($payableId);

            $data = [
                'payable_id'  => $payable->id,
                'period'      => $request->period,
                'due_date'    => $request->due_date,
                'amount'      => $request->amount,
                'amount_paid' => $request->amount_paid,
                'paid_at'     => $request->paid_at,
                'reference'   => $request->reference,
                'notes'       => $request->notes,
            ];

            if ($request->hasFile('comprobante')) {
                $file = $request->file('comprobante');
                $path = $file->store('comprobantes', 'local');
                $data['comprobante_path'] = $path;
                $data['comprobante_name'] = $file->getClientOriginalName();
            }

            $payment = PayablePayment::create($data);

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
            'amount_paid' => 'nullable|numeric|min:0',
            'paid_at'     => 'nullable|date',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'comprobante' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png,webp',
        ]);

        DB::beginTransaction();
        try {
            $payment = PayablePayment::where('deleted', 0)->findOrFail($id);

            $data = $request->only(['amount_paid', 'paid_at', 'reference', 'notes']);

            if ($request->hasFile('comprobante')) {
                // Eliminar archivo anterior si existe
                if ($payment->comprobante_path) {
                    Storage::disk('local')->delete($payment->comprobante_path);
                }
                $file = $request->file('comprobante');
                $path = $file->store('comprobantes', 'local');
                $data['comprobante_path'] = $path;
                $data['comprobante_name'] = $file->getClientOriginalName();
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

    public function comprobante(Request $request, $id)
    {
        try {
            $payment = PayablePayment::where('deleted', 0)->findOrFail($id);

            if (!$payment->comprobante_path || !Storage::disk('local')->exists($payment->comprobante_path)) {
                return response()->json(['message' => 'Comprobante no encontrado'], 404);
            }

            $path     = Storage::disk('local')->path($payment->comprobante_path);
            $name     = $payment->comprobante_name ?? basename($payment->comprobante_path);
            $mime     = mime_content_type($path);

            if ($request->boolean('download')) {
                return response()->download($path, $name, ['Content-Type' => $mime]);
            }

            return response()->file($path, ['Content-Type' => $mime]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Pago no encontrado'], 404);
        } catch (Throwable $e) {
            Log::error('PayablePaymentController@comprobante: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener comprobante'], 500);
        }
    }
}
