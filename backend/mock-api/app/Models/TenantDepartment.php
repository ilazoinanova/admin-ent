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
        'use_department_billing',
        'applies_tax',
        'tax_name',
        'tax_percent',
        'billing_cycle',
        'billing_day_from',
        'billing_day_to',
        'currency',
        'payment_terms_days',
        'billing_email',
        'billing_contact',
        'billing_notes',
        'status',
        'deleted',
    ];

    protected $casts = [
        'use_department_billing' => 'boolean',
        'applies_tax'            => 'boolean',
        'tax_percent'            => 'float',
        'billing_day_from'       => 'integer',
        'billing_day_to'         => 'integer',
        'payment_terms_days'     => 'integer',
        'status'                 => 'integer',
        'deleted'                => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
