<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuoteItem extends Model
{
    protected $fillable = [
        'quote_id',
        'tenant_service_id',
        'service_id',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'total',
    ];

    protected $casts = [
        'quantity'   => 'float',
        'unit_price' => 'float',
        'total'      => 'float',
    ];

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }
}
