<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'category',
        'unit',
        'notes',
        'status',
        'deleted',
        // Conservados nullable para uso futuro
        'price',
        'currency',
    ];

    protected $casts = [
        'price'   => 'float',
        'status'  => 'integer',
        'deleted' => 'integer',
    ];
}
