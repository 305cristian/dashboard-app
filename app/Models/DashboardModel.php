<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class DashboardModel extends Model
{
    protected $table = 'dashboards';
    protected $excelModel;

    protected $fillable = [
        'name',
        'config',
        'created_at'
    ];

    public function __construct()
    {
        $this->excelModel = new ExcelModel();
    }

    /**
     * Obtiene las dimensiones disponibles para el dashboard
     */
    public function getDimensions()
    {

        $data =  $this->excelModel->getProcessedData();
        $headers =  $this->excelModel->getHeaders();

        if (empty($data) || empty($headers)) {
            return [];
        }

        // Analizar las columnas para identificar dimensiones (valores categóricos o fechas)
        $dimensions = [];
        $sampleSize = min(50, count($data));

        foreach ($headers as $header) {
            // Saltear si no hay datos para esta columna
            if (!isset($data[0][$header])) {
                continue;
            }

            $dateCount = 0;

            // Analizar los primeros N registros para determinar el tipo de datos
            for ($i = 0; $i < $sampleSize && $i< count($data); $i++) {
                $value = $data[$i][$header]?? null;

                if (empty($value)) continue;

                // Verificar si es fecha
                if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) {
                    $dateCount++;
                }
            }
            // Obtener todos los valores únicos de la columna
            $columnValues = array_column($data, $header);
            $uniqueValues = array_values(array_unique(array_filter($columnValues, function($val) {
                return $val !== null && $val !== '';
            })));

            $dataCount = count($data);

            // Si tiene pocos valores únicos en relación a los datos o es una fecha, considerarlo dimensión
            if ((count($uniqueValues) < 0.5 * $dataCount && count($uniqueValues) > 1) ||
                $dateCount > 0.8 * $sampleSize ||
                in_array($header, ['GRUPO', 'SUBGRUPO', 'BODEGA', 'IVA', 'SERVICIO', 'USER', 'MOTIVO AJUSTE', 'PRODUCTO', 'FECHA']) ) {

                $dimensions[] = [
                    'name' => $header,
                    'unique_values' => $uniqueValues,
                    'is_date' => $dateCount > 0.8 * $sampleSize,
                    'type' => $dateCount > 0.8 * $sampleSize ? 'date' : 'category'
                ];
            }
        }

        return $dimensions;
    }

    /**
     * Obtiene las métricas disponibles para el dashboard
     */
    public function getMetrics()
    {
        $data = $this->excelModel->getProcessedData();
        $headers = $this->excelModel->getHeaders();

        if (empty($data) || empty($headers)) {
            return [];
        }

        // Analizar las columnas para identificar métricas (valores numéricos)
        $metrics = [];
        $sampleSize = min(100, count($data));

        foreach ($headers as $header) {
            // Saltear si no hay datos para esta columna
            if (!isset($data[0][$header])) {
                continue;
            }

            $numericCount = 0;

            // Analizar los primeros N registros para determinar si son numéricos
            for ($i = 0; $i < $sampleSize && $i < count($data); $i++) {
                $value = $data[$i][$header];

                if (empty($value))continue;

                // Verificar si es numérico
                if (is_numeric($value)) {
                    $numericCount++;
                }
            }

            $dataCount = 0;
            for ($i = 0; $i < $sampleSize && $i < count($data); $i++) {
                if (!empty($data[$i][$header])) {
                    $dataCount++;
                }
            }

            // Si la mayoría son valores numéricos, considerarlo métrica
            if ($numericCount > 0.8 * $dataCount && $dataCount > 0) {
                $metrics[] = [
                    'name' => $header,
                    'type' => 'numeric'
                ];
            }
        }

        return $metrics;
    }

    /**
     * Obtiene datos filtrados para el dashboard
     */
    public function getFilteredData($dimensions, $metrics, $filters = [], $dateRange = null)
    {

        $data = $this->excelModel->getProcessedData();

        if (empty($data)) {
            return [
                'success' => false,
                'message' => 'No hay datos disponibles'
            ];
        }

        // Aplicar filtros
        $filteredData = [];

        foreach ($data as $row) {

            $includeRow = true;

            // Verificar filtros
            if (!empty($filters) && isset($filters['column'], $filters['values'])) {
                $column = $filters['column'];
                $values = $filters['values'];

                // Si el valor de la fila no está en los valores permitidos, se descarta
                if (!isset($row[$column]) || !in_array($row[$column], $values)) {
                    $includeRow = false;
                }
            }

            // Verificar rango de fechas
            if ($includeRow && !empty($dateRange) && !empty($dateRange['column'])) {
                $dateColumn = $dateRange['column'];

                if (isset($row[$dateColumn])) {
                    $rowDate = strtotime($row[$dateColumn]);

                    if (!empty($dateRange['start'])) {
                        $startDate = strtotime($dateRange['start']);
                        if ($rowDate < $startDate) {
                            $includeRow = false;
                        }
                    }

                    if ($includeRow && !empty($dateRange['end'])) {
                        $endDate = strtotime($dateRange['end']);
                        if ($rowDate > $endDate) {
                            $includeRow = false;
                        }
                    }
                }
            }

            if ($includeRow) {
                $filteredData[] = $row;
            }
        }

        // Si no hay dimensiones o métricas, devolver los datos filtrados
        if (empty($dimensions) && empty($metrics)) {
            return [
                'success' => true,
                'data' => $filteredData,
                'count' => count($filteredData)
            ];
        }

        // Agrupar datos por dimensiones
        $groupedData = [];
        $chartData = [];

        // Si hay dimensiones, agrupar por ellas
        if (!empty($dimensions)) {
            foreach ($filteredData as $row) {
                $groupKey = '';
                $groupLabels = [];

                foreach ($dimensions as $dimension) {
                    $value = isset($row[$dimension]) ? $row[$dimension] : 'N/A';
                    $groupKey .= $value . '|';
                    $groupLabels[$dimension] = $value;
                }

                if (!isset($groupedData[$groupKey])) {
                    $groupedData[$groupKey] = [
                        'labels' => $groupLabels,
                        'metrics' => array_fill_keys($metrics, 0),
                        'count' => 0
                    ];
                }

                // Calcular métricas
                foreach ($metrics as $metric) {
                    if (isset($row[$metric]) && is_numeric($row[$metric])) {
                        $groupedData[$groupKey]['metrics'][$metric] += floatval($row[$metric]);
                    }
                }

                $groupedData[$groupKey]['count']++;
            }

            // Formatear datos para gráficos
            foreach ($groupedData as $group) {
                $item = $group['labels'];
                foreach ($metrics as $metric) {
                    $item[$metric] = $group['metrics'][$metric];
                }
                $item['count'] = $group['count'];
                $chartData[] = $item;
            }
        } else {
            // Si no hay dimensiones, calcular totales para cada métrica
            $totals = array_fill_keys($metrics, 0);
            $count = 0;

            foreach ($filteredData as $row) {
                foreach ($metrics as $metric) {
                    if (isset($row[$metric]) && is_numeric($row[$metric])) {
                        $totals[$metric] += floatval($row[$metric]);
                    }
                }
                $count++;
            }

            $chartData[] = array_merge(['count' => $count], $totals);
        }

        return [
            'success' => true,
            'data' => $chartData,
            'count' => count($filteredData),
            'total_groups' => count($chartData)
        ];
    }

    /**
     * Guarda la configuración de un dashboard
     */
    public function saveDashboardConfig($name, $config)
    {
        return self::create([
            'name' => $name,
            'config' => json_encode($config),
            'created_at' => now()
        ]);
    }

    /**
     * Obtiene todos los dashboards guardados
     */
    public function getSavedDashboards()
    {
        return self::all()->toArray();
    }

    /**
     * Obtiene un dashboard por su ID
     */
    public function getDashboardById($id)
    {
        $dashboard = self::find($id);

        if ($dashboard) {
            $dashboardArray = $dashboard->toArray();
            $dashboardArray['config'] = json_decode($dashboardArray['config'], true);
            return $dashboardArray;
        }

        return null;
    }
}
