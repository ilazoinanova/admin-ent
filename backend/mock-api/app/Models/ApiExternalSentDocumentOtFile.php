<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiExternalSentDocumentOtFile extends Model
{
    protected $table = 'api_external_sent_documents_ot_files';

    protected $fillable = [
        'tenant_id',
        'department_id',
        'project_id',
        'system_integration_name',
        'ot_number',
        'date',
        'report_type',
        'sent',
        'sync_status',
        'deleted',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function department()
    {
        return $this->belongsTo(TenantDepartment::class);
    }
}
