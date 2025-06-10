<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TempDataJson extends Model
{
    // Nombre de la tabla si no sigue la convención plural
    protected $table = 'temp_data_json';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'json_head',
        'json_data',
    ];

    // Casts para acceder como arrays o JSON directamente
    protected $casts = [
        'json_head' => 'array',
        'json_data' => 'array',
    ];
}
