<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payable extends Model
{
    protected $fillable = [
        'name',
        'category',
        'vendor',
        'amount',
        'currency',
        'frequency',
        'due_day',
        'start_date',
        'end_date',
        'status',
        'notes',
        'deleted',
    ];

    protected $casts = [
        'amount'     => 'float',
        'due_day'    => 'integer',
        'status'     => 'integer',
        'deleted'    => 'integer',
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
    ];

    public function payments()
    {
        return $this->hasMany(PayablePayment::class);
    }
}
