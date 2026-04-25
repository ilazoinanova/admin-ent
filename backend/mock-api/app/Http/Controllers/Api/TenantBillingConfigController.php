<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantBillingConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class TenantBillingConfigController extends Controller
{
    public function show($tenantId)
    {
        try {
            $config = TenantBillingConfig::where('tenant_id', $tenantId)->first();

            return response()->json($config);
        } catch (Throwable $e) {
            Log::error('TenantBillingConfigController@show: ' . $e->getMessage());

            return response()->json(['message' => 'Error al obtener configuración'], 500);
        }
    }

    public function upsert(Request $request, $tenantId)
    {
        $validated = $request->validate([
            'applies_tax'        => 'boolean',
            'tax_name'           => 'nullable|string|max:50',
            'tax_percent'        => 'numeric|min:0|max:100',
            'billing_cycle'      => 'required|in:monthly,quarterly,biannual,annual',
            'billing_day_from'   => 'required|integer|min:1|max:31',
            'billing_day_to'     => 'required|integer|min:1|max:31',
            'currency'           => 'required|string|size:3',
            'payment_terms_days' => 'required|integer|min:1|max:365',
            'billing_email'      => 'nullable|email|max:255',
            'billing_contact'    => 'nullable|string|max:255',
            'notes'              => 'nullable|string',
        ]);

        $from  = $validated['billing_day_from'];
        $to    = $validated['billing_day_to'];
        $range = $from <= $to ? ($to - $from) : (31 - $from + $to);

        if ($range > 30) {
            return response()->json([
                'errors' => ['billing_day_to' => ['El rango de corte no puede superar 30 días.']],
            ], 422);
        }

        try {
            $config = TenantBillingConfig::updateOrCreate(
                ['tenant_id' => $tenantId],
                $validated
            );

            return response()->json($config);
        } catch (Throwable $e) {
            Log::error('TenantBillingConfigController@upsert: ' . $e->getMessage());

            return response()->json(['message' => 'Error al guardar configuración'], 500);
        }
    }
}
