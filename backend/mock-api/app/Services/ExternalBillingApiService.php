<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ExternalBillingApiService
{
    private string $baseUrl;
    private ?string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.external_billing.url', ''), '/');
        $this->token   = config('services.external_billing.token');
    }

    /**
     * Obtiene el conteo de licencias activas para el período desde la app externa.
     *
     * Endpoint esperado: POST {baseUrl}/billing/license-count
     * Body JSON: { tenant_id, department_id (nullable), period_from, period_to }
     * Respuesta: { "count": 42, "tenant_id": 1, "department_id": 2, ... }
     */
    public function getLicenseCount(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): int
    {
        $this->assertConfigured();

        $response = Http::withToken($this->token)
            ->timeout(15)
            ->post("{$this->baseUrl}/billing/license-count", array_filter([
                'tenant_id'     => $tenantId,
                'department_id' => $departmentId,
                'period_from'   => $periodFrom,
                'period_to'     => $periodTo,
            ], fn ($v) => $v !== null));

        if (! $response->successful()) {
            throw new RuntimeException(
                "API externa de licencias respondió con status {$response->status()}: {$response->body()}"
            );
        }

        return (int) $response->json('count', 0);
    }

    /**
     * Obtiene el conteo y detalle de documentos de integración facturables desde la app externa.
     *
     * Endpoint esperado: POST {baseUrl}/billing/integration-documents
     * Body JSON: { tenant_id, department_id (nullable), period_from, period_to }
     * Respuesta: { "count": 150, "documents": [...], "tenant_id": 1, ... }
     */
    public function getIntegrationDocuments(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): array
    {
        $this->assertConfigured();

        $response = Http::withToken($this->token)
            ->timeout(15)
            ->post("{$this->baseUrl}/billing/integration-documents", array_filter([
                'tenant_id'     => $tenantId,
                'department_id' => $departmentId,
                'period_from'   => $periodFrom,
                'period_to'     => $periodTo,
            ], fn ($v) => $v !== null));

        if (! $response->successful()) {
            throw new RuntimeException(
                "API externa de documentos respondió con status {$response->status()}: {$response->body()}"
            );
        }

        return [
            'count'     => (int) $response->json('count', 0),
            'documents' => $response->json('documents', []),
        ];
    }

    private function assertConfigured(): void
    {
        if (empty($this->baseUrl)) {
            throw new RuntimeException('EXTERNAL_BILLING_API_URL no está configurada en .env');
        }
    }
}
