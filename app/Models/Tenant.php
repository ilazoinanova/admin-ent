<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'code',
        'email',
        'domain',
        'phone',
        'address',
        'city',
        'country',
        'status',
        'deleted'
    ];

    protected $casts = [
        'status' => 'integer',
        'deleted' => 'integer'
    ];

    public function departments()
    {
        return $this->hasMany(TenantDepartment::class)->where('deleted', 0);
    }

    public function billingConfig()
    {
        return $this->hasOne(TenantBillingConfig::class);
    }
}