<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('services')->upsert([
            [
                'name'        => 'Licencias',
                'code'        => 'SRV-LIC',
                'description' => 'Licenciamiento de software por usuario',
                'category'    => 'Software',
                'unit'        => 'usuario',
                'price'       => 0,
                'currency'    => 'CLP',
                'status'      => 1,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
            [
                'name'        => 'Integraciones',
                'code'        => 'SRV-INT',
                'description' => 'Integraciones con sistemas externos',
                'category'    => 'Tecnología',
                'unit'        => 'integración',
                'price'       => 0,
                'currency'    => 'CLP',
                'status'      => 1,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
            [
                'name'        => 'Desarrollos',
                'code'        => 'SRV-DES',
                'description' => 'Desarrollo de software a medida',
                'category'    => 'Tecnología',
                'unit'        => 'hora',
                'price'       => 0,
                'currency'    => 'CLP',
                'status'      => 1,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
            [
                'name'        => 'Consultorias',
                'code'        => 'SRV-CON',
                'description' => 'Consultoría técnica y de negocio',
                'category'    => 'Consultoría',
                'unit'        => 'hora',
                'price'       => 0,
                'currency'    => 'CLP',
                'status'      => 1,
                'deleted'     => 0,
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
        ], ['code'], ['name', 'description', 'category', 'unit', 'updated_at']);
    }
}
