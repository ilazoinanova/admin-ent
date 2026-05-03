<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * 50 registros de prueba para Olympia Power System (tenant_id=1), Operaciones (department_id=4).
 *
 * Distribución pensada para validar facturación del período Abril 2026 (2026-04-01 → 2026-04-30):
 *
 * DEBEN cobrarse (35 registros):
 *   - [1-15]  Activas desde antes de Abril, sin baja (NULL unassigned_at)
 *   - [16-25] Activas desde dentro de Abril, sin baja
 *   - [26-30] Activas antes de Abril, dadas de baja a mitad de Abril
 *   - [31-35] Activas desde inicio de Abril, dadas de baja al final de Abril
 *
 * NO deben cobrarse (15 registros):
 *   - [36-40] Dadas de baja antes de que empezara Abril (baja en Febrero/Marzo)
 *   - [41-45] Asignadas en Mayo 2026 (después del período)
 *   - [46-50] Asignadas en 2025, dadas de baja en Enero/Febrero 2026
 */
class UserLicenseTestSeeder extends Seeder
{
    private const TENANT_ID     = 1;  // Olympia Power System
    private const DEPARTMENT_ID = 4;  // Operaciones

    public function run(): void
    {
        $now = Carbon::now();

        $licenses   = $this->createLicenses($now);
        $records    = $this->buildUserLicenseRecords($licenses, $now);

        DB::table('user_licenses')->insert($records);

        $this->command->info('Insertados 50 user_licenses de prueba para Olympia/Operaciones.');
        $this->command->info('Referencia: período de facturación Abril 2026 (2026-04-01 → 2026-04-30).');
        $this->command->info('  → Deben cobrarse: registros 1-35');
        $this->command->info('  → NO deben cobrarse: registros 36-50');
    }

    private function createLicenses(Carbon $now): array
    {
        $ids = [];

        for ($i = 1; $i <= 50; $i++) {
            $ids[] = DB::table('licenses')->insertGetId([
                'tenant_id'    => self::TENANT_ID,
                'license_key'  => 'TEST-OPS-' . str_pad($i, 4, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5($i . 'seed'), 0, 8)),
                'license_type' => 'user',
                'status'       => 'active',
                'activated_at' => $now,
                'deleted'      => 0,
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
        }

        return $ids;
    }

    private function buildUserLicenseRecords(array $licenses, Carbon $now): array
    {
        $records = [];

        // ── Grupo 1 (índices 0-14): Activas desde antes de Abril, sin baja → SE COBRAN ──
        for ($i = 0; $i < 15; $i++) {
            $assignedAt = Carbon::create(2026, random_int(1, 3), random_int(1, 28));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, null, 'active', $now);
        }

        // ── Grupo 2 (índices 15-24): Activas desde dentro de Abril, sin baja → SE COBRAN ──
        for ($i = 15; $i < 25; $i++) {
            $assignedAt = Carbon::create(2026, 4, random_int(1, 20));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, null, 'active', $now);
        }

        // ── Grupo 3 (índices 25-29): Activas antes de Abril, baja a mitad de Abril → SE COBRAN ──
        for ($i = 25; $i < 30; $i++) {
            $assignedAt   = Carbon::create(2026, random_int(1, 3), random_int(1, 28));
            $unassignedAt = Carbon::create(2026, 4, random_int(10, 20));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, $unassignedAt, 'inactive', $now);
        }

        // ── Grupo 4 (índices 30-34): Activas inicio de Abril, baja fin de Abril → SE COBRAN ──
        for ($i = 30; $i < 35; $i++) {
            $assignedAt   = Carbon::create(2026, 4, random_int(1, 5));
            $unassignedAt = Carbon::create(2026, 4, random_int(25, 30));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, $unassignedAt, 'inactive', $now);
        }

        // ── Grupo 5 (índices 35-39): Baja antes de Abril (Feb/Mar) → NO SE COBRAN ──
        for ($i = 35; $i < 40; $i++) {
            $assignedAt   = Carbon::create(2026, random_int(1, 2), random_int(1, 15));
            $unassignedAt = Carbon::create(2026, random_int(2, 3), random_int(16, 28));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, $unassignedAt, 'inactive', $now);
        }

        // ── Grupo 6 (índices 40-44): Asignadas en Mayo 2026 (después del período) → NO SE COBRAN ──
        for ($i = 40; $i < 45; $i++) {
            $assignedAt = Carbon::create(2026, 5, random_int(1, 30));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, null, 'active', $now);
        }

        // ── Grupo 7 (índices 45-49): Asignadas en 2025, baja en Ene/Feb 2026 → NO SE COBRAN ──
        for ($i = 45; $i < 50; $i++) {
            $assignedAt   = Carbon::create(2025, random_int(9, 12), random_int(1, 28));
            $unassignedAt = Carbon::create(2026, random_int(1, 2), random_int(1, 28));
            $records[] = $this->row($licenses[$i], $i + 1, $assignedAt, $unassignedAt, 'inactive', $now);
        }

        return $records;
    }

    private function row(int $licenseId, int $userId, Carbon $assignedAt, ?Carbon $unassignedAt, string $status, Carbon $now): array
    {
        return [
            'tenant_id'     => self::TENANT_ID,
            'department_id' => self::DEPARTMENT_ID,
            'user_id'       => $userId,
            'license_id'    => $licenseId,
            'status'        => $status,
            'assigned_at'   => $assignedAt,
            'unassigned_at' => $unassignedAt,
            'deleted'       => 0,
            'created_at'    => $now,
            'updated_at'    => $now,
        ];
    }
}
