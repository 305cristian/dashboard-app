<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class LayoutModel extends Model
{
    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'dashboard_layouts';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'description',
        'layout_config',
        'user_id',
        'is_public',
        'created_at',
        'updated_at',
        'count_widgets',
        'category'
    ];

    /**
     * Guarda un layout de dashboard
     *
     * @param string $name Nombre del layout
     * @param array $layoutConfig Configuración del layout
     * @param int|null $userId ID del usuario
     * @return int|bool ID del layout guardado o false si hay error
     */
    public function saveLayout($layoutConfig, $userId = null)
    {
        $layout = self::create([
            'name' => $layoutConfig['name'],
            'description' => $layoutConfig['description'] ?? '',
            'layout_config' => json_encode($layoutConfig),
            'user_id' => $userId ?? Auth::id(),
            'is_public'=>$layoutConfig['is_public'],
            'count_widgets'=>count($layoutConfig['widgets']),
            'category'=>'Operations',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return $layout ? $layout->id : false;
    }

    /**
     * Actualiza un layout existente
     *
     * @param int $layoutId ID del layout
     * @param array $layoutConfig Configuración del layout
     * @return bool Éxito de la operación
     */
    public function updateLayout($layoutId, $layoutConfig)
    {
        $layout = self::find($layoutId);

        if (!$layout) {
            return false;
        }

        $layout->layout_config = json_encode($layoutConfig);
        $layout->updated_at = now();

        if (isset($layoutConfig['name'])) {
            $layout->name = $layoutConfig['name'];
        }

        if (isset($layoutConfig['description'])) {
            $layout->description = $layoutConfig['description'];
        }

        return $layout->save();
    }

    /**
     * Obtiene un layout por su ID
     *
     * @param int $layoutId ID del layout
     * @return array|null Datos del layout o null si no existe
     */
    public function getLayout($layoutId)
    {
        $layout = self::find($layoutId);

        if (!$layout) {
            return null;
        }

        $layoutArray = $layout->toArray();
        $layoutArray['layout_config'] = json_decode($layoutArray['layout_config'], true);

        return $layoutArray;
    }

    /**
     * Obtiene todos los layouts de un usuario
     *
     * @param int|null $userId ID del usuario (NULL para obtener layouts públicos)
     * @return array Lista de layouts
     */
    public function getUserLayouts($userId = null)
    {
        $query = self::query();

        if ($userId === null) {
            $query->where('is_public', 1);
        } else {
            $query->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('is_public', 1);
            });
        }

        return $query->get()->toArray();
    }

    /**
     * Elimina un layout
     *
     * @param int $layoutId ID del layout
     * @return bool Éxito de la operación
     */
    public function deleteLayout($layoutId)
    {
        $layout = self::find($layoutId);

        if (!$layout) {
            return false;
        }

        return $layout->delete();
    }

    /**
     * Obtiene una lista de plantillas predefinidas de layouts
     *
     * @return array Lista de plantillas
     */
    public function getLayoutTemplates()
    {
        return [
            [
                'id' => 'single',
                'name' => 'Una visualización',
                'description' => 'Dashboard con una única visualización a pantalla completa',
                'layout' => [
                    [
                        'id' => 'widget-1',
                        'type' => 'chart',
                        'width' => 12,
                        'height' => 8,
                        'position' => ['row' => 0, 'col' => 0]
                    ]
                ]
            ],
            [
                'id' => 'two-columns',
                'name' => 'Dos columnas',
                'description' => 'Dashboard con dos visualizaciones lado a lado',
                'layout' => [
                    [
                        'id' => 'widget-1',
                        'type' => 'chart',
                        'width' => 6,
                        'height' => 8,
                        'position' => ['row' => 0, 'col' => 0]
                    ],
                    [
                        'id' => 'widget-2',
                        'type' => 'chart',
                        'width' => 6,
                        'height' => 8,
                        'position' => ['row' => 0, 'col' => 6]
                    ]
                ]
            ],
            [
                'id' => 'dashboard',
                'name' => 'Dashboard completo',
                'description' => 'Dashboard con tarjetas de resumen y gráficos detallados',
                'layout' => [
                    [
                        'id' => 'widget-1',
                        'type' => 'card',
                        'width' => 3,
                        'height' => 2,
                        'position' => ['row' => 0, 'col' => 0]
                    ],
                    [
                        'id' => 'widget-2',
                        'type' => 'card',
                        'width' => 3,
                        'height' => 2,
                        'position' => ['row' => 0, 'col' => 3]
                    ],
                    [
                        'id' => 'widget-3',
                        'type' => 'card',
                        'width' => 3,
                        'height' => 2,
                        'position' => ['row' => 0, 'col' => 6]
                    ],
                    [
                        'id' => 'widget-4',
                        'type' => 'card',
                        'width' => 3,
                        'height' => 2,
                        'position' => ['row' => 0, 'col' => 9]
                    ],
                    [
                        'id' => 'widget-5',
                        'type' => 'chart',
                        'width' => 8,
                        'height' => 6,
                        'position' => ['row' => 2, 'col' => 0]
                    ],
                    [
                        'id' => 'widget-6',
                        'type' => 'chart',
                        'width' => 4,
                        'height' => 6,
                        'position' => ['row' => 2, 'col' => 8]
                    ],
                    [
                        'id' => 'widget-7',
                        'type' => 'table',
                        'width' => 12,
                        'height' => 4,
                        'position' => ['row' => 8, 'col' => 0]
                    ]
                ]
            ],
            [
                'id' => 'report',
                'name' => 'Informe ejecutivo',
                'description' => 'Layout para informes con gráficos y tablas de datos',
                'layout' => [
                    [
                        'id' => 'widget-1',
                        'type' => 'chart',
                        'width' => 12,
                        'height' => 4,
                        'position' => ['row' => 0, 'col' => 0]
                    ],
                    [
                        'id' => 'widget-2',
                        'type' => 'chart',
                        'width' => 6,
                        'height' => 4,
                        'position' => ['row' => 4, 'col' => 0]
                    ],
                    [
                        'id' => 'widget-3',
                        'type' => 'chart',
                        'width' => 6,
                        'height' => 4,
                        'position' => ['row' => 4, 'col' => 6]
                    ],
                    [
                        'id' => 'widget-4',
                        'type' => 'table',
                        'width' => 12,
                        'height' => 4,
                        'position' => ['row' => 8, 'col' => 0]
                    ]
                ]
            ]
        ];
    }
}
