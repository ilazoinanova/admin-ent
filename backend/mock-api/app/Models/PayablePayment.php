<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayablePayment extends Model
{
    protected $fillable = [
        'payment_period_id',
        'payable_id',
        'is_additional',
        'title',
        'description',
        'period',
        'due_date',
        'amount',
        'amount_paid',
        'paid_at',
        'reference',
        'notes',
        'comprobante_path',
        'comprobante_name',
        'deleted',
    ];

    protected $appends = ['status'];

    protected $casts = [
        'amount'            => 'float',
        'amount_paid'       => 'float',
        'deleted'           => 'integer',
        'is_additional'     => 'boolean',
        'due_date'          => 'date:Y-m-d',
        'paid_at'           => 'date:Y-m-d',
    ];

    public function getStatusAttribute(): string
    {
        if ($this->paid_at !== null) {
            return 'paid';
        }
        if ($this->due_date && $this->due_date->lt(now()->startOfDay())) {
            return 'overdue';
        }
        return 'pending';
    }

    public function payable()
    {
        return $this->belongsTo(Payable::class);
    }

    public function paymentPeriod()
    {
        return $this->belongsTo(PaymentPeriod::class);
    }
}
