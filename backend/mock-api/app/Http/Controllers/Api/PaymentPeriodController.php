<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payable;
use App\Models\PayablePayment;
use App\Models\PaymentPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentPeriodController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentPeriod::where('deleted', false);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('active')) {
            $query->where('active', (bool) $request->active);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('year', 'like', "%{$search}%")
                  ->orWhere(DB::raw('LPAD(month, 2, "0")'), 'like', "%{$search}%");
            });
        }

        $sort      = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');
        $allowed   = ['year', 'month', 'type', 'start_day', 'end_day', 'active', 'created_at'];
        if (!in_array($sort, $allowed)) {
            $sort = 'year';
        }

        $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc')
              ->orderBy('month', 'desc');

        $perPage = (int) $request->get('per_page', 15);
        $result  = $query->paginate($perPage);

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'      => ['required', Rule::in(['monthly', 'annual'])],
            'month'     => ['required_if:type,monthly', 'nullable', 'integer', 'min:1', 'max:12'],
            'year'      => ['required', 'integer', 'min:2000', 'max:2100'],
            'start_day' => ['required', 'integer', 'min:1', 'max:31'],
            'end_day'   => ['required', 'integer', 'min:1', 'max:31'],
        ]);

        $data['active']  = false;
        $data['deleted'] = false;

        if ($data['type'] === 'annual') {
            $data['month'] = null;
        }

        $duplicate = PaymentPeriod::where('deleted', false)
            ->where('type', $data['type'])
            ->where('year', $data['year'])
            ->when($data['type'] === 'monthly', fn($q) => $q->where('month', $data['month']))
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'Ya existe un período con ese tipo, mes y año.'], 422);
        }

        $period = PaymentPeriod::create($data);

        return response()->json($period, 201);
    }

    public function update(Request $request, $id)
    {
        $period = PaymentPeriod::where('id', $id)->where('deleted', false)->firstOrFail();

        $data = $request->validate([
            'type'      => [Rule::in(['monthly', 'annual'])],
            'month'     => ['nullable', 'integer', 'min:1', 'max:12'],
            'year'      => ['integer', 'min:2000', 'max:2100'],
            'start_day' => ['integer', 'min:1', 'max:31'],
            'end_day'   => ['integer', 'min:1', 'max:31'],
        ]);

        $type  = $data['type']  ?? $period->type;
        $year  = $data['year']  ?? $period->year;
        $month = ($type === 'monthly') ? ($data['month'] ?? $period->month) : null;

        $duplicate = PaymentPeriod::where('deleted', false)
            ->where('id', '!=', $id)
            ->where('type', $type)
            ->where('year', $year)
            ->when($type === 'monthly', fn($q) => $q->where('month', $month))
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'Ya existe un período con ese tipo, mes y año.'], 422);
        }

        if ($type === 'annual') {
            $data['month'] = null;
        }

        $period->update($data);

        return response()->json($period->fresh());
    }

    public function toggleActive($id)
    {
        $period = PaymentPeriod::where('id', $id)->where('deleted', false)->firstOrFail();

        $period->active = !$period->active;
        $period->save();

        return response()->json($period->fresh());
    }

    public function initialize($id)
    {
        $period = PaymentPeriod::where('id', $id)->where('deleted', false)->firstOrFail();

        $periodLabel = $period->label; // ej. "05-2026" o "2026"

        // Formato legacy que usa el campo `period` en payable_payments: "YYYY-MM" para monthly
        $legacyPeriod = $period->type === 'monthly'
            ? $period->year . '-' . str_pad($period->month, 2, '0', STR_PAD_LEFT)
            : (string) $period->year;

        $activePayables = Payable::where('deleted', 0)->where('status', 1)->get();

        DB::beginTransaction();
        try {
            foreach ($activePayables as $payable) {
                $exists = PayablePayment::where('payment_period_id', $period->id)
                    ->where('payable_id', $payable->id)
                    ->where('is_additional', false)
                    ->exists();

                if (!$exists) {
                    // Calcular due_date usando due_day del payable y el período
                    $month = $period->type === 'monthly' ? $period->month : 12;
                    $year  = $period->year;
                    $day   = min($payable->due_day ?? $period->end_day, cal_days_in_month(CAL_GREGORIAN, $month, $year));

                    PayablePayment::create([
                        'payment_period_id' => $period->id,
                        'payable_id'        => $payable->id,
                        'period'            => $legacyPeriod,
                        'due_date'          => sprintf('%04d-%02d-%02d', $year, $month, $day),
                        'amount'            => $payable->amount ?? 0,
                        'is_additional'     => false,
                        'deleted'           => 0,
                    ]);
                }
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al inicializar el período: ' . $e->getMessage()], 500);
        }

        // Retornar todos los registros del período (plantilla + adicionales)
        $payments = PayablePayment::with('payable:id,name,vendor,currency,category,frequency,due_day,amount,notes,status')
            ->where('payment_period_id', $period->id)
            ->where('deleted', 0)
            ->orderBy('is_additional')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'period'   => $period,
            'payments' => $payments,
        ]);
    }

    public function destroy($id)
    {
        $period = PaymentPeriod::where('id', $id)->where('deleted', false)->firstOrFail();

        $period->update(['deleted' => true]);

        return response()->json(['message' => 'Período eliminado.']);
    }
}
