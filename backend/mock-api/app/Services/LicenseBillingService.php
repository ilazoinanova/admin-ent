<?php

namespace App\Services;

use App\Models\TenantService;
use Illuminate\Support\Facades\DB;

class LicenseBillingService
{
    /**
     * Cuenta user_licenses activas durante el período para un tenant/department.
     * Una licencia se cobra si estuvo activa al menos un día dentro del período:
     *   assigned_at <= period_to  AND  (unassigned_at IS NULL OR unassigned_at >= period_from)
     */
    public function countBillableLicenses(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): int
    {
        return DB::table('user_licenses')
            ->where('tenant_id', $tenantId)
            ->where('department_id', $departmentId)
            ->where('deleted', 0)
            ->where('assigned_at', '<=', $periodTo)
            ->where(function ($q) use ($periodFrom) {
                $q->whereNull('unassigned_at')
                  ->orWhere('unassigned_at', '>=', $periodFrom);
            })
            ->count();
    }

    /**
     * Calcula el monto a cobrar dado un assignment activo y un período.
     * Retorna el desglose listo para alimentar un ítem de factura.
     */
    public function calculateForAssignment(TenantService $assignment, string $periodFrom, string $periodTo): array
    {
        $count = $this->countBillableLicenses(
            $assignment->tenant_id,
            $assignment->department_id,
            $periodFrom,
            $periodTo
        );

        return match ($assignment->license_modalidad) {
            'fixed'             => $this->calcFixed($assignment, $count),
            'tiered_fixed'      => $this->calcTieredFixed($assignment, $count),
            'tiered_escalating' => $this->calcTieredEscalating($assignment, $count),
            default             => [
                'active_licenses_count' => $count,
                'license_modalidad'     => $assignment->license_modalidad,
                'breakdown'             => [],
                'total_price'           => 0,
                'error'                 => 'Modalidad de licencia no reconocida',
            ],
        };
    }

    // ── Modalidades ──────────────────────────────────────────────────────────

    private function calcFixed(TenantService $assignment, int $count): array
    {
        $pricePerUser = (float) $assignment->price;
        $total        = round($count * $pricePerUser, 2);

        return [
            'active_licenses_count' => $count,
            'license_modalidad'     => 'fixed',
            'breakdown'             => [[
                'label'          => "Precio fijo por usuario",
                'count'          => $count,
                'price_per_user' => $pricePerUser,
                'subtotal'       => $total,
            ]],
            'total_price' => $total,
        ];
    }

    private function calcTieredFixed(TenantService $assignment, int $count): array
    {
        $tiers = $assignment->tiers()
            ->where('active', 1)
            ->where('deleted', 0)
            ->orderBy('min_users')
            ->get();

        $matchedTier = $tiers->first(fn ($t) => $count >= $t->min_users && $count <= $t->max_users);

        if (! $matchedTier) {
            return [
                'active_licenses_count' => $count,
                'license_modalidad'     => 'tiered_fixed',
                'breakdown'             => [],
                'total_price'           => 0,
                'error'                 => "Sin tramo configurado para {$count} usuarios",
            ];
        }

        $pricePerUser = (float) $matchedTier->price_per_user;
        $total        = round($count * $pricePerUser, 2);

        return [
            'active_licenses_count' => $count,
            'license_modalidad'     => 'tiered_fixed',
            'breakdown'             => [[
                'label'          => "Tramo {$matchedTier->min_users}-{$matchedTier->max_users} usuarios",
                'count'          => $count,
                'price_per_user' => $pricePerUser,
                'subtotal'       => $total,
            ]],
            'total_price' => $total,
        ];
    }

    /**
     * Precio escalonado progresivo: cada tramo paga su propio precio.
     * Ejemplo con 35 usuarios y tramos 1-10@$40, 11-25@$35, 26-40@$30:
     *   10×$40 + 15×$35 + 10×$30 = $400 + $525 + $300 = $1,225
     */
    private function calcTieredEscalating(TenantService $assignment, int $count): array
    {
        $tiers = $assignment->tiers()
            ->where('active', 1)
            ->where('deleted', 0)
            ->orderBy('min_users')
            ->get();

        $breakdown   = [];
        $total       = 0.0;
        $remaining   = $count;

        foreach ($tiers as $tier) {
            if ($remaining <= 0) {
                break;
            }

            $tierCapacity = $tier->max_users - $tier->min_users + 1;
            $usersInTier  = min($remaining, $tierCapacity);
            $pricePerUser = (float) $tier->price_per_user;
            $subtotal     = round($usersInTier * $pricePerUser, 2);

            $breakdown[] = [
                'label'          => "Tramo {$tier->min_users}-{$tier->max_users} usuarios",
                'count'          => $usersInTier,
                'price_per_user' => $pricePerUser,
                'subtotal'       => $subtotal,
            ];

            $total     += $subtotal;
            $remaining -= $usersInTier;
        }

        // Si quedan usuarios fuera de rango, los absorbe el último tramo
        if ($remaining > 0 && $tiers->isNotEmpty()) {
            $lastTier     = $tiers->last();
            $pricePerUser = (float) $lastTier->price_per_user;
            $subtotal     = round($remaining * $pricePerUser, 2);

            $breakdown[] = [
                'label'          => "Tramo {$lastTier->min_users}+ usuarios (excedente)",
                'count'          => $remaining,
                'price_per_user' => $pricePerUser,
                'subtotal'       => $subtotal,
            ];

            $total += $subtotal;
        }

        return [
            'active_licenses_count' => $count,
            'license_modalidad'     => 'tiered_escalating',
            'breakdown'             => $breakdown,
            'total_price'           => round($total, 2),
        ];
    }
}
