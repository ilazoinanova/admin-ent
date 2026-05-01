<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    protected $fillable = [
        'quote_number',
        'tenant_id',
        'department_id',
        'issued_by',
        'issue_date',
        'expiry_date',
        'status',
        'subtotal',
        'total',
        'currency',
        'notes',
        'deleted',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'total'    => 'float',
        'deleted'  => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function department()
    {
        return $this->belongsTo(TenantDepartment::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function items()
    {
        return $this->hasMany(QuoteItem::class);
    }
}
