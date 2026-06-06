<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentPeriod extends Model
{
    protected $fillable = [
        'type',
        'month',
        'year',
        'start_day',
        'end_day',
        'active',
        'deleted',
    ];

    protected $casts = [
        'active'    => 'boolean',
        'deleted'   => 'boolean',
        'month'     => 'integer',
        'year'      => 'integer',
        'start_day' => 'integer',
        'end_day'   => 'integer',
    ];

    private const MONTHS_ES = [
        1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
        5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
        9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
    ];

    public function getLabelAttribute(): string
    {
        if ($this->type === 'annual') {
            return (string) $this->year;
        }

        $monthName = self::MONTHS_ES[$this->month] ?? str_pad($this->month, 2, '0', STR_PAD_LEFT);

        return $monthName . ' ' . $this->year;
    }

    protected $appends = ['label'];
}
