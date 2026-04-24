<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayablePayment extends Model
{
    protected $fillable = [
        'payable_id',
        'period',
        'due_date',
        'amount',
        'amount_paid',
        'paid_at',
        'status',
        'reference',
        'notes',
        'deleted',
    ];

    protected $casts = [
        'amount'      => 'float',
        'amount_paid' => 'float',
        'deleted'     => 'integer',
        'due_date'    => 'date:Y-m-d',
        'paid_at'     => 'date:Y-m-d',
    ];

    public function payable()
    {
        return $this->belongsTo(Payable::class);
    }
}
