<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantBillingConfig extends Model
{
    protected $fillable = [
        'tenant_id',
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
        'notes',
    ];

    protected $casts = [
        'applies_tax'        => 'boolean',
        'tax_percent'        => 'float',
        'billing_day_from'   => 'integer',
        'billing_day_to'     => 'integer',
        'payment_terms_days' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
