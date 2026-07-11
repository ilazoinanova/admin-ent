<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Representa una respuesta de error del contrato de EasyNextTime
 * (formato { "error": "...", "message": "...", "errors": {...} }).
 */
class ExternalBillingApiException extends RuntimeException
{
    /**
     * @param array<string, array<int, string>> $errors
     */
    public function __construct(
        string $message,
        public readonly int $statusCode,
        public readonly ?string $errorCode = null,
        public readonly array $errors = [],
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message);
    }
}
