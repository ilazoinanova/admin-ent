<?php

namespace App\Services;

use App\Exceptions\ExternalBillingApiException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ExternalBillingApiService
{
    private const TOKEN_CACHE_KEY = 'external_billing_access_token';

    private string $baseUrl;
    private ?string $clientId;
    private ?string $clientSecret;

    public function __construct()
    {
        $this->baseUrl      = rtrim((string) config('services.external_billing.url', ''), '/');
        $this->clientId     = config('services.external_billing.client_id');
        $this->clientSecret = config('services.external_billing.client_secret');
    }

    /**
     * Obtiene el conteo de licencias activas para el período desde la app externa.
     *
     * Endpoint: POST {baseUrl}/billing/license-count
     * Body JSON: { tenant_id, department_id (nullable), period_from, period_to }
     * Respuesta: { "count": 42, "count_with_activities": 38, "tenant_id": 1, ... }
     */
    public function getLicenseCount(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo): int
    {
        $data = $this->request('/billing/license-count', array_filter([
            'tenant_id'     => $tenantId,
            'department_id' => $departmentId,
            'period_from'   => $periodFrom,
            'period_to'     => $periodTo,
        ], fn ($v) => $v !== null));

        return (int) ($data['count'] ?? 0);
    }

    /**
     * Obtiene el conteo y detalle de documentos de integración facturables desde la app externa.
     *
     * Endpoint: POST {baseUrl}/billing/integration-documents
     * Body JSON: { tenant_id, department_id (nullable), period_from, period_to, include_unique (nullable) }
     * Respuesta: { "count": 3, "documents": [...], "tenant_id": 1, ... }
     *
     * @param bool|null $includeUnique true: solo documentos enviados una sola vez (excluye reenvíos).
     *                                  false: incluye los reenviados. null: no se envía (la API usa su default = true).
     */
    public function getIntegrationDocuments(int $tenantId, ?int $departmentId, string $periodFrom, string $periodTo, ?bool $includeUnique = null): array
    {
        $data = $this->request('/billing/integration-documents', array_filter([
            'tenant_id'      => $tenantId,
            'department_id'  => $departmentId,
            'period_from'    => $periodFrom,
            'period_to'      => $periodTo,
            'include_unique' => $includeUnique,
        ], fn ($v) => $v !== null));

        return [
            'count'     => (int) ($data['count'] ?? 0),
            'documents' => $data['documents'] ?? [],
        ];
    }

    /**
     * Obtiene la lista de empresas (tenants) desde la API externa.
     *
     * Endpoint: POST {baseUrl}/master/tenants
     * Body JSON: { "status": "active|inactive|all", "include_deleted": bool }
     * Respuesta: { "count": N, "truncated": bool, "items": [{id, name, domain, status, deleted}] }
     */
    public function getTenants(string $status = 'active', bool $includeDeleted = false): array
    {
        return $this->request('/master/tenants', [
            'status'          => $status,
            'include_deleted' => $includeDeleted,
        ]);
    }

    /**
     * Obtiene catálogos maestros de un tenant (departamentos, zonas, proyectos, licencias).
     *
     * Endpoint: POST {baseUrl}/master/lists
     * Body JSON: { "tenant_id": N, "models": [...], "status": "active|all", "include_deleted": bool }
     * Respuesta: { "tenant_id": N, "models": { "departments": { "count": N, "items": [...] } } }
     */
    public function getMasterLists(int $tenantId, array $models = ['departments'], string $status = 'active', bool $includeDeleted = false): array
    {
        return $this->request('/master/lists', [
            'tenant_id'       => $tenantId,
            'models'          => $models,
            'status'          => $status,
            'include_deleted' => $includeDeleted,
        ]);
    }

    /**
     * Realiza un POST autenticado contra un endpoint de negocio de la API externa.
     * Si el token está vencido (401), lo refresca y reintenta una sola vez.
     *
     * @throws ExternalBillingApiException si la respuesta final no es exitosa.
     */
    private function request(string $endpoint, array $payload): array
    {
        $response = $this->send($endpoint, $payload, $this->getAccessToken());

        if ($response->status() === 401) {
            $response = $this->send($endpoint, $payload, $this->getAccessToken(forceRefresh: true));
        }

        if (! $response->successful()) {
            throw $this->toException($response);
        }

        return $response->json() ?? [];
    }

    private function send(string $endpoint, array $payload, string $accessToken): Response
    {
        return Http::withToken($accessToken)
            ->timeout(15)
            ->post("{$this->baseUrl}{$endpoint}", $payload);
    }

    /**
     * Obtiene el Bearer token (cacheado mientras sea válido).
     *
     * Endpoint: POST {baseUrl}/auth/token
     * Body JSON: { client_id, client_secret }
     * Respuesta: { "access_token": "...", "token_type": "Bearer", "expires_in": 3600 }
     */
    private function getAccessToken(bool $forceRefresh = false): string
    {
        if (! $forceRefresh) {
            $cached = Cache::get(self::TOKEN_CACHE_KEY);

            if ($cached) {
                return $cached;
            }
        }

        $this->assertConfigured();

        $response = Http::timeout(15)
            ->post("{$this->baseUrl}/auth/token", [
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

        if (! $response->successful()) {
            throw $this->toException($response);
        }

        $accessToken = (string) $response->json('access_token');
        $expiresIn   = (int) $response->json('expires_in', 3600);

        // Margen de 60s para evitar usar un token que expire justo durante la siguiente llamada.
        Cache::put(self::TOKEN_CACHE_KEY, $accessToken, max($expiresIn - 60, 30));

        return $accessToken;
    }

    /**
     * Convierte una respuesta de error en la excepción tipada del contrato de EasyNextTime:
     * { "error": "...", "message": "...", "errors": {...} }
     */
    private function toException(Response $response): ExternalBillingApiException
    {
        $body = $response->json() ?? [];

        $retryAfter = $response->header('Retry-After');

        return new ExternalBillingApiException(
            message: $body['message'] ?? "API externa de facturación respondió con status {$response->status()}",
            statusCode: $response->status(),
            errorCode: $body['error'] ?? null,
            errors: $body['errors'] ?? [],
            retryAfter: $retryAfter !== null ? (int) $retryAfter : null,
        );
    }

    private function assertConfigured(): void
    {
        if (empty($this->baseUrl) || empty($this->clientId) || empty($this->clientSecret)) {
            throw new RuntimeException(
                'La configuración de la API externa de facturación (EXTERNAL_BILLING_API_URL, EXTERNAL_BILLING_CLIENT_ID, EXTERNAL_BILLING_CLIENT_SECRET) está incompleta en .env'
            );
        }
    }
}
