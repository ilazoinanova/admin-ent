<?php

namespace App\Rules;

use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Valida que el rango entre un campo "desde" y el valor actual ("hasta")
 * no supere un máximo de días. Usado por los endpoints de facturación que
 * consumen la API externa de EasyNextTime (rango > 92 días → 422).
 */
class MaxDateRange implements ValidationRule
{
    public function __construct(
        private readonly string $fromField,
        private readonly int $maxDays,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $from = request()->input($this->fromField);

        if (! $from || ! $value) {
            return;
        }

        if (Carbon::parse($from)->diffInDays(Carbon::parse($value)) > $this->maxDays) {
            $fail("El rango entre {$this->fromField} y {$attribute} no puede superar los {$this->maxDays} días.");
        }
    }
}
