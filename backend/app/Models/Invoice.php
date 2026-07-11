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
        'qr_url',
        'accounting_email_to',
        'accounting_email_subject',
        'accounting_sent_at',
        'fiscal_pdf_url',
        'client_email_to',
        'client_email_cc',
        'client_sent_at',
        'deleted',
    ];

    protected $casts = [
        'subtotal'           => 'float',
        'tax_rate'           => 'float',
        'tax'                => 'float',
        'total'              => 'float',
        'deleted'            => 'integer',
        'issue_date'         => 'date:Y-m-d',
        'due_date'           => 'date:Y-m-d',
        'accounting_sent_at' => 'datetime',
        'client_sent_at'     => 'datetime',
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
