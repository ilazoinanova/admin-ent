<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantDepartment extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'description',
        'status',
        'deleted',
    ];

    protected $casts = [
        'status'  => 'integer',
        'deleted' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
