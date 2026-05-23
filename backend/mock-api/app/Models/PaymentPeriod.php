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

    public function getLabelAttribute(): string
    {
        if ($this->type === 'annual') {
            return (string) $this->year;
        }

        return str_pad($this->month, 2, '0', STR_PAD_LEFT) . '-' . $this->year;
    }

    protected $appends = ['label'];
}
