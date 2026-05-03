<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'tenant_id',
        'department_id',
        'billing_period',
        'period_from',
        'period_to',
        'issued_by',
        'issue_date',
        'due_date',
        'status',
        'subtotal',
        'tax_rate',
        'tax',
        'total',
        'currency',
        'notes',
        'deleted',
    ];

    protected $casts = [
        'subtotal'  => 'float',
        'tax_rate'  => 'float',
        'tax'       => 'float',
        'total'     => 'float',
        'deleted'   => 'integer',
        'issue_date' => 'date:Y-m-d',
        'due_date'   => 'date:Y-m-d',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function department()
    {
        return $this->belongsTo(TenantDepartment::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(UserAdmin::class, 'issued_by');
    }
}
