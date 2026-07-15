<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantService extends Model
{
    protected $table = 'tenant_service_assignments';

    protected $fillable = [
        'tenant_id',
        'department_id',
        'service_id',
        'license_type',
        'license_modalidad',
        'billing_cycle',
        'price',
        'currency',
        'development_type',
        'hours_total',
        'hours_used',
        'start_date',
        'end_date',
        'unit',
        'status'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function tiers()
    {
        return $this->hasMany(TenantServiceTier::class);
    }

    public function department()
    {
        return $this->belongsTo(TenantDepartment::class);
    }
}