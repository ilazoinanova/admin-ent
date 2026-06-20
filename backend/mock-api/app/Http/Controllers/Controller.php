<?php

namespace App\Http\Controllers;

use App\Exceptions\ExternalBillingApiException;
use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Traduce un error de la API externa de facturación (EasyNextTime) a una
     * respuesta JSON acorde a su código de estado documentado:
     * 403 (tenant no autorizado), 422 (validación), 429 (rate limit) y demás → 503.
     */
    protected function externalBillingErrorResponse(ExternalBillingApiException $e): JsonResponse
    {
        return match ($e->statusCode) {
            403 => response()->json([
                'message' => 'No está autorizado para consultar este tenant en la API externa de facturación.',
            ], 403),
            422 => response()->json([
                'message' => $e->getMessage(),
                'errors'  => $e->errors,
            ], 422),
            429 => response()->json([
                'message' => 'Demasiadas solicitudes a la API externa de facturación. Intente nuevamente más tarde.',
            ], 429)->withHeaders($e->retryAfter !== null ? ['Retry-After' => (string) $e->retryAfter] : []),
            default => response()->json([
                'message' => 'Error al comunicarse con la API externa de facturación.',
            ], 503),
        };
    }
}
