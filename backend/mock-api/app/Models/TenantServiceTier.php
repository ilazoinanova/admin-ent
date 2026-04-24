<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantServiceTier extends Model
{
    protected $fillable = [
        'tenant_service_id',
        'min_users',
        'max_users',
        'price_per_user'
    ];

    public function tenantService()
    {
        return $this->belongsTo(TenantService::class);
    }
}