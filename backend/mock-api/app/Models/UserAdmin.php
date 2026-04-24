<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable; // 🔥 ESTA LÍNEA ES LA CLAVE
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class UserAdmin extends Authenticatable
{
    use Notifiable;
    use HasApiTokens;


    protected $table = 'users_admin';

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'company',
        'password',
        'role',
        'status'
    ];

    protected $hidden = [
        'password',
        'remember_token'
    ];
}