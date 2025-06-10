<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Session;
use App\Models\ExcelModel;
use App\Models\DashboardModel;
use App\Models\LayoutModel;
use App\Models\TempDataJson;


class DashboardController extends Controller
{
    protected $excelModel;
    protected $dashboardModel;
    protected $layoutModel;
    protected $tempDataJson;

    /**
     * Constructor con inyección de dependencias
     */
    public function __construct()
    {
        $this->excelModel = new ExcelModel();
        $this->dashboardModel = new DashboardModel();
        $this->layoutModel = new LayoutModel();
        $this->tempDataJson = new TempDataJson();
    }

    public function index()
    {
        $send = [
            "title" => "Dashboards",
            "listaWidgets" => $this->layoutModel->getUserLayouts(),
        ];
        return Inertia::render('dashboard/viewHomeDashboard', $send);
    }


    public function viewCreate(Request $request)
    {
        $send['title'] = 'Dashboards APP';
        $data['file_loaded'] = Session::has('excel_file_path');

        if ($data['file_loaded']) {
            $send = [
                "listaDimensions" => $this->dashboardModel->getDimensions(),
                "listaMetrics" => $this->dashboardModel->getMetrics(),
                "listaTemplate" => $this->layoutModel->getLayoutTemplates()
            ];
        } else {
            //Obtenemos los datos guardados en la db
            $registro = $this->tempDataJson::orderByDesc('id')->first();

            $headerDash = $registro ? $registro->json_head : null;
            $dataDash = $registro ? $registro->json_data : null;

            // Guardar en la sesión para uso temporal
            Session::put('excel_headers', $headerDash);
            Session::put('excel_data', $dataDash);

            $send = [
                "listaDimensions" => $this->dashboardModel->getDimensions(),
                "listaMetrics" => $this->dashboardModel->getMetrics(),
                "listaTemplate" => $this->layoutModel->getLayoutTemplates()
            ];
        }


        return Inertia::render('dashboard/viewNewDashboard', $send);
    }

    public function viewUpload(Request $request): Response
    {
        return Inertia::render('dashboard/viewUploadFile');
    }


    public function processDataFromReport(Request $request)
    {

        $datos = $request->input('datos');

        if (empty($datos)) {
            return response()->json([
                'success' => false,
                'message' => 'No se proporcionaron datos válidos o no existen'
            ]);
        }

        // Procesar los datos
        $result = $this->excelModel->processDataFromDatabase($datos);

        if ($result) {

            $response = [
                'status' => 'success',
                'message' => 'Información cargado exitosamente.',
                'redirectUrl' => "/dashboard/create",
            ];

            $this->tempDataJson::truncate(); //Elimino todos los datos y me quedo solo con el último
            $this->tempDataJson::create([
                'json_data' => Session::get('excel_data', []),
                'json_head' => Session::get('excel_headers', [])
            ]);

        } else {

            $response = [
                'status' => 'error',
                'message' => 'Error al procesar el archivo.',
            ];
        }

        return response()->json($response);

    }

    public function uploadFile(Request $request)
    {
        // Validar el archivo
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls|max:20480' // 20MB
        ]);

        $response = [];

        if ($request->hasFile('excel_file') && $request->file('excel_file')->isValid()) {
            // Guardar el archivo en el disco 'public' (o cualquier otro disco configurado)
            $filePath = $request->file('excel_file')->store('uploads', 'public');

            // Obtener la ruta completa para procesar el archivo
            $fullPath = Storage::disk('public')->path($filePath);

            // Procesar el archivo Excel
            $result = $this->excelModel->processExcelFile($fullPath);


            if ($result) {
                // Guardar ruta del archivo en la sesión
                Session::put('excel_file_path', $fullPath);
                $response = [
                    'status' => 'success',
                    'msg' => 'Archivo cargado exitosamente.',
                    'redirectUrl' => "/dashboard/create",
                ];
            } else {
                $response = [
                    'status' => 'error',
                    'msg' => 'Error al procesar el archivo.',
                ];
            }

        } else {
            $response = [
                'status' => 'error',
                'msg' => 'Error al cargar el archivo.',
            ];

        }
        return response()->json($response);
    }

    public function getWidgetData(Request $request)
    {

        $dimensions = $request->input('dimensions');
        $metrics = $request->input('metrics');
        $filters = $request->input('filters');
        $dateRange = $request->input('date_range');
        $chartType = $request->input('chart_type');
        $aggregation = $request->input('aggregation');
        $limit = $request->input('limit');
        $order = $request->input('order');

        // Validar parámetros requeridos
        if (empty($dimensions) || empty($metrics)) {
            return response()->json([
                'success' => false,
                'message' => 'Se requieren dimensiones y métricas para generar visualizaciones'
            ]);
        }

        try {
            // Obtener datos filtrados del modelo
            $data = $this->dashboardModel->getFilteredData($dimensions, $metrics, $filters, $dateRange);

            // Verificar si hay datos
            if (empty($data['data'])) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No hay datos para los criterios seleccionados'
                ]);
            }

            // Preparar datos para el tipo de visualización
            $result = $this->prepareVisualizationData($data, $dimensions, $metrics, $chartType, $limit, $order);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error en DashboardController::getWidgetData: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar datos: ' . $e->getMessage()
            ]);
        }

    }

    private function prepareVisualizationData(array $data, array $dimensions, array $metrics, string $chartType, int $limit, string $order): array
    {
        $limite = intval($limit);

        $sortMetric = $metrics[0] ?? null;//Voy a ordenar siempre por el primero valor de la metrica, ejm: ['kardex','precio'], esto ordenara por kardex

        if ($sortMetric !== null) {
            usort($data['data'], function ($a, $b) use ($sortMetric, $order) {
                if ($order === 'desc') {
                    return floatval($b[$sortMetric]) <=> floatval($a[$sortMetric]); // Descendente
                } else {
                    return floatval($a[$sortMetric]) <=> floatval($b[$sortMetric]); // Ascendente
                }

            });

            $limitedData = array_slice($data['data'], 0, $limite);//Agarra los $limit mas altos
        } else {
            // Limitar datos si es necesario
            $limitedData = array_slice($data['data'], 0, $limite); // Agarra los $limit primeros registros
        }

        // Para gráficos
        if (in_array($chartType, ['column', 'bar', 'line', 'area', 'pie'])) {
            $categories = [];
            $series = [];

            // Preparar categorías (eje X) - basadas en primera dimensión
            if (!empty($dimensions)) {
                $dimensionField = $dimensions[0];
                foreach ($limitedData as $item) {
                    if (isset($item[$dimensionField])) {
                        $categories[] = $item[$dimensionField];
                    }
                }
            }

            // Preparar series (una por cada métrica)
            foreach ($metrics as $metric) {
                $seriesData = [];
                foreach ($limitedData as $item) {
                    if (isset($item[$metric])) {
                        $seriesData[] = floatval($item[$metric]);
                    } else {
                        $seriesData[] = 0;
                    }
                }

                $series[] = [
                    'name' => $metric,
                    'data' => $seriesData
                ];
            }

            return [
                'success' => true,
                'categories' => $categories,
                'series' => $series,
                'count' => count($data['data'])
            ];
        } // Para tablas
        elseif ($chartType === 'table') {

            return [
                'success' => true,
                'data' => $limitedData,
                'count' => count($data['data'])
            ];
        } // Para tarjetas
        elseif ($chartType === 'card') {
            $aggregatedData = [];

            foreach ($metrics as $metric) {
                $sum = 0;
                $count = 0;

                foreach ($data['data'] as $item) {
                    if (isset($item[$metric])) {
                        $sum += floatval($item[$metric]);
                        $count++;
                    }
                }

                $avg = $count > 0 ? $sum / $count : 0;

                $aggregatedData[$metric] = [
                    'sum' => $sum,
                    'avg' => $avg,
                    'count' => $count
                ];
            }

            return [
                'success' => true,
                'data' => $aggregatedData,
                'count' => count($data['data'])
            ];
        }

        // Por defecto, devolver los datos sin procesar
        return [
            'success' => true,
            'data' => $data['data'],
            'count' => count($data['data'])
        ];
    }

    public function save(Request $request)
    {
        // Validar los datos de entrada
        $validated = $request->validate([
            'layout_config' => 'required|array',
        ]);

        // Guardar el layout utilizando el modelo
        $result = $this->layoutModel->saveLayout($validated['layout_config']);

        // Devolver respuesta JSON
        return response()->json([
            'success' => (bool)$result,
            'layout_id' => $result
        ]);
    }


    public function viewPreview($id)
    {

        $layout = $this->layoutModel->getLayout($id);

        // Verificar si existe
        if (!$layout) {
            return redirect()->route('dashboard.home')
                ->with('error', 'El dashboard solicitado no existe.');
        }

        // Obtener dimensiones y métricas
        $dimensions = $this->dashboardModel->getDimensions();
        $metrics = $this->dashboardModel->getMetrics();

        $send = [
            'pageTitle' => 'Dashboard',
            'title' => 'Ver Dashboard',
            'layout' => $layout,
            'dimensions' => $dimensions,
            'metrics' => $metrics
        ];

        return Inertia::render('dashboard/viewPreview', $send);
    }
}

