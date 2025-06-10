<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as WriterXlsx;

class ExcelModel extends Model
{
    protected $excelData = [];
    protected $headers = [];

    /**
     * Procesa un archivo Excel y almacena sus datos
     *
     * @param string $filePath Ruta del archivo Excel
     * @return bool Éxito o fracaso del procesamiento
     */
    public function processExcelFile($filePath)
    {

        try {
            // Crear el lector Excel según la extensión del archivo
            $fileExtension = pathinfo($filePath, PATHINFO_EXTENSION);

            if ($fileExtension == 'xlsx') {
                $reader = new Xlsx();
            } else {
                $reader = new Xls();
            }

            // Cargar el archivo
            $spreadsheet = $reader->load($filePath);

            $worksheet = $spreadsheet->getActiveSheet();


            // Obtener las dimensiones del documento
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();
            $highestColumnIndex = Coordinate::columnIndexFromString($highestColumn);

            // Buscar la fila que contiene los encabezados
            $headerRow = $this->findHeaderRow($worksheet, $highestRow, $highestColumnIndex);

            // Extraer los encabezados
            $this->headers = [];
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $headerValue = $worksheet->getCellByColumnAndRow($col, $headerRow)->getValue();
                if (!empty($headerValue)) {
                    $this->headers[$col] = trim($headerValue);
                }
            }

            // Extraer los datos
            $this->excelData = [];
            for ($row = $headerRow + 1; $row <= $highestRow; $row++) {
                $rowData = [];
                $hasData = false;

                foreach ($this->headers as $col => $header) {
                    $cellValue = $worksheet->getCellByColumnAndRow($col, $row)->getValue();

                    $rowData[$header] = $cellValue;

                    if (!empty($cellValue)) {
                        $hasData = true;
                    }
                }

                // Solo añadir filas que contengan datos
                if ($hasData) {
                    $this->excelData[] = $rowData;
                }
            }

            // Guardar datos en la sesión
            $this->saveProcessedData();

            return true;
        } catch (Exception $e) {
            Log::error('Error al procesar archivo Excel: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Procesa los datos directamente del array de la base de datos
     *
     * @param array $databaseData Array de datos de la base de datos
     * @return bool
     */
    public function processDataFromDatabase($databaseData)
    {
        try {
            // Verificar que tenemos datos para procesar
            if (empty($databaseData) || !is_array($databaseData)) {
                throw new Exception('No se proporcionaron datos válidos');
            }

            // Si hay datos, extraer los encabezados del primer elemento
            if (count($databaseData) > 0) {
                // Obtener las claves del primer elemento como encabezados
                $firstItem = reset($databaseData);



                // Filtrar encabezados para excluir arrays anidados
                $this->headers = [];
                foreach ($firstItem as $key => $value) {
                    if (!is_array($value)) {
                        $this->headers[] = $key;
                    }
                }

                // Preparar los datos para la sesión, excluyendo arrays anidados
                $this->excelData = [];
                foreach ($databaseData as $item) {
                    $rowData = [];
                    foreach ($this->headers as $header) {
                        $rowData[$header] = $item[$header] ?? null;
                    }
                    $this->excelData[] = $rowData;
                }

            } else {
                throw new Exception('No hay datos disponibles para procesar');
            }

            // Guardar datos en la sesión
            $this->saveProcessedData();

            return true;
        } catch (Exception $e) {
            Log::error('Error al procesar datos: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Encuentra la fila que contiene los encabezados
     */
    private function findHeaderRow($worksheet, $highestRow, $highestColumnIndex)
    {
        // Buscar en las primeras 20 filas o hasta el límite del documento
        $searchLimit = min(20, $highestRow);

        for ($row = 1; $row <= $searchLimit; $row++) {
            $nonEmptyCells = 0;
            $potentialHeaders = [];

            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $cellValue = $worksheet->getCellByColumnAndRow($col, $row)->getValue();

                if (!empty($cellValue)) {
                    $nonEmptyCells++;
                    $potentialHeaders[] = $cellValue;
                }
            }

            // Si hay al menos 5 celdas no vacías, podría ser la fila de encabezados
            if ($nonEmptyCells >= 5) {
                // Comprobar si los encabezados incluyen palabras clave esperadas
                $headerKeywords = ['FECHA', 'CODIGO', 'PRODUCTO', 'KARDEX', 'GRUPO', 'TOTAL', 'PRECIO', 'PRICE'];
                $matches = 0;

                foreach ($potentialHeaders as $header) {
                    foreach ($headerKeywords as $keyword) {
                        if (stripos($header, $keyword) !== false) {
                            $matches++;
                            break;
                        }
                    }
                }

                // Si coincide con al menos 2 palabras clave, considerar como fila de encabezados
                if ($matches >= 3) {
                    return $row;
                }
            }
        }

        // Si no se encontró ninguna fila de encabezados válida
        return 1; // Asumir que la fila 1 es la fila de encabezados
    }

    /**
     * Guarda los datos procesados para su uso posterior
     */
    private function saveProcessedData()
    {

        // Guardar en la sesión para uso temporal
        Session::put('excel_headers', $this->headers);
        Session::put('excel_data', $this->excelData);

    }

    /**
     * Obtiene los datos procesados del Excel
     */
    public function getProcessedData()
    {
        if (empty($this->excelData)) {
            $this->excelData = Session::get('excel_data', []);
            $this->headers = Session::get('excel_headers', []);
        }

        return $this->excelData;
    }

    /**
     * Obtiene los encabezados del Excel
     */
    public function getHeaders()
    {
        if (empty($this->headers)) {
            $this->headers = Session::get('excel_headers', []);
        }

        return $this->headers;
    }

    /**
     * Exporta los datos a Excel
     */
    public function exportToExcel($data)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Añadir encabezados
        $col = 1;
        foreach (array_keys($data[0]) as $header) {
            $sheet->setCellValueByColumnAndRow($col, 1, $header);
            $col++;
        }

        // Añadir datos
        $row = 2;
        foreach ($data as $rowData) {
            $col = 1;
            foreach ($rowData as $value) {
                $sheet->setCellValueByColumnAndRow($col, $row, $value);
                $col++;
            }
            $row++;
        }

        // Aplicar estilo a los encabezados
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ];

        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray($headerStyle);

        // Autoajustar columnas
        foreach (range('A', $sheet->getHighestColumn()) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generar el archivo
        $writer = new WriterXlsx($spreadsheet);

        $filename = 'dashboard_export_' . date('Y-m-d_H-i-s') . '.xlsx';

        // En Laravel, usamos estos headers para descargar
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Exporta los datos a CSV
     */
    public function exportToCsv($data)
    {
        $filename = 'dashboard_export_' . date('Y-m-d_H-i-s') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $output = fopen('php://output', 'w');

            // Añadir encabezados
            fputcsv($output, array_keys($data[0]));

            // Añadir datos
            foreach ($data as $row) {
                fputcsv($output, $row);
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
