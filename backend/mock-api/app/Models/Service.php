<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'price',
        'currency',
        'unit',
        'status',
        'deleted'
    ];

    protected $casts = [
        'price' => 'float',
        'status' => 'integer',
        'deleted' => 'integer'
    ];
}