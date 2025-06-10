import {GridStack} from 'gridstack';
import Highcharts from 'highcharts';
import 'gridstack/dist/gridstack.min.css';
import axios from 'axios';

export default {
    props: {
        title: String,
        listaDimensions: Array,
        listaMetrics: Array,
        layout: Object,
        listaTemplate: Array,
        dataDash:String,
        headDash:Array
    },
    name: 'DashboardEditor',
    data() {
        return {

            isPreviewMode: false,

            // UI States
            widgetSettingsDialog: false,
            saveLayoutDialog: false,
            confirmDeleteDialog: false,
            confirmClearDialog: false,
            activeTab: 'data',
            viewMode: 'grid',
            editingJson: false,

            // Dashboard Data
            dashboardName: '',
            widgets: {},
            nextWidgetId: 1,
            currentWidgetId: null,
            currentWidgetType: null,
            gridInstance: null,

            // Widget Configuration
            widgetSettings: {
                title: '',
                type: '',
                visualization: '',
                dimensions: [],
                metrics: [],
                aggregation: 'sum',
                limit: 10,
                order:'desc',
                filters: {
                    column: null,
                    values: []
                },
                date_range: {
                    column: null,
                    start: '',
                    end: ''
                },
                appearance: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    fontSize: 'medium',
                    colorTheme: 'default',
                    showLegend: true,
                    showValues: false
                },
                autoRefresh: false,
                refreshInterval: 60
            },
            widgetConfigJson: '',

            // Selection helpers
            availableDimensionsSelected: [],
            selectedDimensionsSelected: [],
            availableMetricsSelected: [],
            selectedMetricsSelected: [],

            // Save Layout Data
            saveLayoutName: '',
            saveLayoutDescription: '',
            saveLayoutPublic: false,

            // Available Options
            availableWidgets: [
                {type: 'chart', title: 'Gráfico', icon: 'mdi-chart-bar'},
                {type: 'pie', title: 'Gráfico Circular', icon: 'mdi-chart-pie'},
                {type: 'line', title: 'Gráfico de Líneas', icon: 'mdi-chart-line'},
                {type: 'table', title: 'Tabla de Datos', icon: 'mdi-table'},
                {type: 'card', title: 'Tarjeta de Métricas', icon: 'mdi-card-text-outline'},
                {type: 'filter', title: 'Panel de Filtros', icon: 'mdi-filter'}
            ],

            // Data options (simuladas para demo)
            availableDimensions: this.listaDimensions,
            availableMetrics: this.listaMetrics,
            //filterValues: [],

            // Template options
            selectedTemplate: '',
            layoutTemplates: this.listaTemplate,

            // Configuration options
            visualizationTypes: [
                {value: 'column', title: 'Gráfico de Columnas'},
                {value: 'bar', title: 'Gráfico de Barras'},
                {value: 'line', title: 'Gráfico de Líneas'},
                {value: 'area', title: 'Gráfico de Área'},
                {value: 'pie', title: 'Gráfico Circular'},
                {value: 'table', title: 'Tabla'},
                {value: 'card', title: 'Tarjetas de Métricas'}
            ],
            aggregationTypes: [
                {value: 'sum', title: 'Suma'},
                {value: 'avg', title: 'Promedio'},
                {value: 'min', title: 'Mínimo'},
                {value: 'max', title: 'Máximo'},
                {value: 'count', title: 'Conteo'}
            ],
            orderTypes: [
                {value: 'asc', title: 'ASC'},
                {value: 'desc', title: 'DESC'},
            ],
            fontSizes: [
                {value: 'small', title: 'Pequeña'},
                {value: 'medium', title: 'Mediana'},
                {value: 'large', title: 'Grande'}
            ],
            colorThemes: [
                {value: 'default', title: 'Predeterminado'},
                {value: 'pastel', title: 'Pastel'},
                {value: 'bright', title: 'Brillante'},
                {value: 'dark', title: 'Oscuro'},
                {value: 'gradient', title: 'Degradado'}
            ]
        }
    },
    computed: {
        dashboardTitle() {
            return this.dashboardName || 'Dashboard sin título';
        },
        templateDescription() {
            if (!this.selectedTemplate) return '';

            const template = this.layoutTemplates.find(t => t.id === this.selectedTemplate);
            return template ? template.description : '';
        },

        dateDimensions() {

            const dateItems = this.listaDimensions.filter(dim => dim.type === 'date')
                .map(dim => ({
                    value: dim.name,
                    title: dim.name
                }));

            return [
                {value: '', title: '-- Sin filtro de fechas --'},
                ...dateItems
            ];
        },
        filterValues() {

            // Si no hay columna seleccionada, retorna array vacío
            if (!this.widgetSettings.filters.column) {
                return [];
            }

            // Busca la dimensión seleccionada en listaDimensions
            const selectedDimension = this.listaDimensions.find(
                dim => dim.name === this.widgetSettings.filters.column
            );
            if (!selectedDimension) {
                return [];
            }

            // Retorna los unique_values de la dimensión seleccionada
            return selectedDimension.unique_values.map(value => ({
                value: value,
                title: value.toString()
            }));

        }

    },

    mounted() {
        this.initGridStack();
        this.initDraggableItems();
        this.initDropZone();

        console.log('mainc',this.dataDash)
        console.log('headx ',this.headDash)
    },
    methods: {

        // Inicializa el sistema de grid para widgets
        initGridStack() {

            // Opciones para GridStack
            const options = {
                cellHeight: 80,
                verticalMargin: 10,
                float: false,
                disableOneColumnMode: false,
                animate: true,
                resizable: {
                    handles: 'e, se, s, sw, w'
                }
            };

            if (this.layout) {
                options.staticGrid = true;
                options.disableResize = true;
                options.disableDrag = true;
            }

            this.$nextTick(() => {
                const layoutGrid = document.getElementById('layout-grid');

                if (layoutGrid) {
                    this.gridInstance = GridStack.init(options, '#layout-grid');

                    // Evento cuando un widget cambia de tamaño o posición
                    this.gridInstance.on('change', (event, items) => {
                        this.updateWidgetsPositions(items);
                    });

                    //Esto solo se ejecuta para la vista de los dashboard guardados
                    if (this.layout) {
                        this.loadDashboardData();
                    }

                } else {
                    console.error('Elemento #layout-grid no encontrado');
                }
            });
        },


        loadDashboardData() {
            this.widgets = this.layout.layout_config.widgets;

            Object.keys(this.widgets).forEach((widgetId) => {
                const widget = this.widgets[widgetId];
                this.addWidgetToGrid(widgetId, widget);
            });

        },
        addWidgetToGrid(widgetId, widget) {
            console.log('widget', widget)

            // Crear contenido del widget

            // Añadir widget al grid con su posición y tamaño
            this.gridInstance.addWidget({
                x: widget.position.col,
                y: widget.position.row,
                w: widget.width,
                h: widget.height,
                id: widgetId,
                el: this.createWidgetContent(widgetId, widget.type, widget.title, 1)
            });

            // Cargar datos para el widget
            this.loadWidgetData(widgetId, widget);
        },


        // Manejo de widgets
        addWidget(type) {
            const widgetId = 'widget-' + this.nextWidgetId++;
            const title = this.getDefaultTitleForType(type);

            // Opciones predeterminadas según el tipo
            let width = 6;
            let height = 4;

            if (type === 'card') {
                width = 3;
                height = 2;
            } else if (type === 'table') {
                width = 12;
                height = 4;
            } else if (type === 'filter') {
                width = 3;
                height = 3;
            }

            // Añadir widget al grid
            const widgetNode = this.gridInstance.addWidget({
                w: width,
                h: height,
                el: this.createWidgetContent(widgetId, type, title)
            });

            // Guardar configuración inicial del widget
            this.widgets[widgetId] = {
                id: widgetId,
                type: type,
                title: title,
                dimensions: [],
                metrics: [],
                filters: {
                    column: null,
                    values: []
                },
                date_range: {
                    column: null,
                    start: '',
                    end: ''
                },
                visualization: this.getDefaultVisualizationForType(type),
                width: width,
                height: height,
                position: this.getWidgetPosition(widgetNode),
                appearance: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    fontSize: 'medium',
                    colorTheme: 'default',
                    showLegend: true,
                    showValues: false
                },
                autoRefresh: false,
                refreshInterval: 60
            };

            // Configurar eventos del widget
            this.$nextTick(() => {
                const $widgetEl = document.querySelector(`[data-widget-id="${widgetId}"]`);

                if ($widgetEl) {
                    // Evento de configuración al hacer clic en el botón
                    const $configBtn = $widgetEl.querySelector('.widget-settings');
                    if ($configBtn) {
                        $configBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.openWidgetSettings(widgetId);
                        });
                    }

                    // Evento para eliminar al hacer doble clic en encabezado
                    const $header = $widgetEl.querySelector('.widget-header');
                    if ($header) {
                        $header.addEventListener('dblclick', () => {
                            this.currentWidgetId = widgetId;
                            this.confirmDeleteDialog = true;
                        });
                    }
                }
            });

            // Abrir configuración automáticamente para el nuevo widget
            this.openWidgetSettings(widgetId);

            return widgetId;
        },

        // Crea el contenido HTML para un widget
        createWidgetContent(widgetId, type, title, varAux) {


            const contentElement = document.createElement('div');
            contentElement.className = 'widget-placeholder-container';
            contentElement.setAttribute("data-widget-id", `${widgetId}`)

            let botonSetting = "";
            if (varAux == 0) {
                botonSetting = ` <div class="widget-actions">
                                  <button class="widget-settings">
                                    <i class="mdi mdi-cog"></i>
                                  </button>
                                </div>`;
            }

            contentElement.innerHTML = `
                          <div class="widget-panel">
                            <div class="widget-header">
                              <h3 class="widget-title-container">
                                <span class="widget-icon">${this.getIconForType(type)}</span>
                                <span class="widget-title">${title}</span>

                               ${botonSetting}
                              </h3>
                            </div>
                            <div class="widget-content">
                              <div class="widget-placeholder text-center">
                                <span class="widget-icon-large">${this.getIconForType(type)}</span>
                                <p class="widget-placeholder-text">Configure este widget para ver datos</p>
                              </div>
                            </div>
                          </div>
                        `;

            return contentElement;
        },

        // Elimina un widget
        removeWidget(widgetId) {
            const gridItem = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);

            if (gridItem && this.gridInstance) {
                this.gridInstance.removeWidget(gridItem);
                delete this.widgets[widgetId];
            }
        },

        // Confirma y ejecuta eliminación de widget
        deleteWidget() {
            if (this.currentWidgetId) {
                this.removeWidget(this.currentWidgetId);
                this.confirmDeleteDialog = false;
                this.widgetSettingsDialog = false;
            }
        },

        // Abre el modal de configuración de un widget
        openWidgetSettings(widgetId) {
            this.currentWidgetId = widgetId;
            const widget = this.widgets[widgetId];

            if (!widget) {
                console.error('Widget no encontrado:', widgetId);
                return;
            }

            this.currentWidgetType = widget.type;

            // Clonar la configuración del widget para editar
            this.widgetSettings = JSON.parse(JSON.stringify(widget));

            // JSON de configuración
            this.widgetConfigJson = JSON.stringify(widget, null, 2);
            this.editingJson = false;

            // Limpiar selecciones
            this.availableDimensionsSelected = [];
            this.selectedDimensionsSelected = [];
            this.availableMetricsSelected = [];
            this.selectedMetricsSelected = [];

            // Mostrar el modal
            this.widgetSettingsDialog = true;
        },

        // Guarda la configuración de un widget
        saveWidgetSettings() {
            if (!this.currentWidgetId) return;

            // Actualizar widget con valores del formulario
            this.widgets[this.currentWidgetId] = JSON.parse(JSON.stringify(this.widgetSettings));

            // Actualizar el título en el widget
            const $widgetTitle = document.querySelector(`.grid-stack-item[data-widget-id="${this.currentWidgetId}"] .widget-title`);
            if ($widgetTitle) {
                $widgetTitle.textContent = this.widgetSettings.title;
            }

            // Cerrar diálogo
            this.widgetSettingsDialog = false;

            // Cargar datos para el widget (en un caso real)
            this.loadWidgetData(this.currentWidgetId);
        },

        // Carga datos para un widget
        loadWidgetData(widgetId) {

            const widget = this.widgets[widgetId];

            // Verificar si el widget tiene todas las propiedades necesarias
            if (!widget) {
                console.error("Widget no encontrado:", widgetId);
                return;
            }

            // Verificar si tiene dimensiones y métricas configuradas
            if (!widget.dimensions || !widget.metrics || widget.dimensions.length === 0 || widget.metrics.length === 0) {
                // En Vue, manipulamos el DOM a través del estado en lugar de jQuery
                this.$nextTick(() => {
                    const widgetNode = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);
                    if (widgetNode) {
                        const contentEl = widgetNode.querySelector('.widget-content');
                        if (contentEl) {
                            contentEl.innerHTML = `
            <div class="alert alert-info">
              <i class="me-2 mdi mdi-information-outline"></i>
              Este widget necesita configuración. Por favor, edite el dashboard para añadir dimensiones y métricas.
            </div>
          `;
                        }
                    }
                });
                return;
            }

            // Mostrar estado de carga
            this.$nextTick(() => {
                const widgetNode = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);
                if (widgetNode) {
                    const contentEl = widgetNode.querySelector('.widget-content');
                    if (contentEl) {
                        contentEl.innerHTML = `
          <div class="text-center">
            <v-progress-circular indeterminate size="50" color="primary"></v-progress-circular>
            <p class="mt-2">Cargando datos...</p>
          </div>
        `;
                    }
                }
            });

            console.log("Solicitando datos para widget", widgetId, "con config:", {
                dimensions: widget.dimensions,
                metrics: widget.metrics,
                filters: widget.filters,
                date_range: widget.date_range
            });


            const datos = {
                dimensions: widget.dimensions,
                metrics: widget.metrics,
                filters: widget.filters || {},
                date_range: widget.date_range || {},
                chart_type: widget.visualization || 'column',
                aggregation: widget.aggregation || 'sum',
                limit: widget.limit || 10,
                order:widget.order || 'desc'
            }
            axios.post('/dashboard/widgetData', datos)
                .then(response => {
                    const data = response.data;
                    console.log("Datos recibidos:", data);

                    if (data.success) {
                        this.renderWidgetData(widgetId, data);
                    } else {
                        this.$nextTick(() => {
                            const widgetNode = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);
                            if (widgetNode) {
                                const contentEl = widgetNode.querySelector('.widget-content');
                                if (contentEl) {
                                    contentEl.innerHTML = `
                                  <div class="alert alert-warning">
                                    <v-icon class="me-2">mdi-alert</v-icon>
                                    ${data.message || 'Error al cargar datos'}
                                  </div>
                                `;
                                }
                            }
                        });
                    }
                })
                .catch(error => {
                    this.$nextTick(() => {
                        const widgetNode = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);
                        if (widgetNode) {
                            const contentEl = widgetNode.querySelector('.widget-content');
                            if (contentEl) {
                                contentEl.innerHTML = `
                                <div class="alert alert-danger">
                                  <v-icon class="me-2">mdi-alert-circle</v-icon>
                                  Error de comunicación con el servidor: ${error.message || error}
                                </div>
                              `;
                            }
                        }
                    });
                });

        },

        renderWidgetData(widgetId, data) {

            const widget = this.widgets[widgetId];

            this.$nextTick(() => {
                const widgetNode = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);
                console.log(widgetNode);
                if (!widgetNode) return;

                const contentEl = widgetNode.querySelector('.widget-content');
                if (!contentEl) {
                    console.error("No se pudo encontrar el contenedor para el widget:", widgetId);
                    return;
                }

                // Verificar si hay datos válidos
                if (!data || !data.success) {
                    // Mostrar mensaje de alerta - usando componentes Vuetify
                    contentEl.innerHTML = `
                            <v-alert
                              type="warning"
                              variant="tonal"
                              icon="mdi-alert"
                              class="my-2"
                            >
                              No hay datos disponibles para los criterios seleccionados.
                            </v-alert>
                          `;
                    return;
                }

                // Limpiar contenido anterior
                contentEl.innerHTML = '';

                // Crear contenedor para el gráfico o tabla
                const containerId = 'widget-container-' + widgetId;
                const container = document.createElement('div');
                container.id = containerId;
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.minHeight = '200px';

                contentEl.appendChild(container);

                // Verificar que el contenedor se creó correctamente
                if (!document.getElementById(containerId)) {
                    console.error("Error: No se pudo crear el contenedor " + containerId);
                    contentEl.innerHTML = `
                            <v-alert
                              type="error"
                              variant="tonal"
                              icon="mdi-alert-circle"
                              class="my-2"
                            >
                              Error al crear el contenedor del gráfico.
                            </v-alert>
                          `;
                    return;
                }

                // Esperar a que el DOM se actualice
                setTimeout(() => {
                    // Renderizar según tipo de visualización
                    try {
                        switch (widget.visualization) {
                            case 'table':
                                this.renderTable(containerId, data, widget);
                                break;
                            case 'card':
                                this.renderCards(containerId, data, widget);
                                break;
                            default:
                                this.renderChart(containerId, data, widget);
                                break;
                        }
                    } catch (e) {
                        console.error("Error al renderizar widget:", e);
                        contentEl.innerHTML = `
                              <v-alert
                                type="error"
                                variant="tonal"
                                icon="mdi-alert-circle"
                                class="my-2"
                              >
                                Error al renderizar: ${e.message}
                              </v-alert>
                            `;
                    }
                }, 50);
            });
        },

        // Renderiza un gráfico Highcharts
        renderChart(containerId, data, widget) {
            const chartOptions = {
                chart: {
                    type: widget.visualization,
                    backgroundColor: widget.appearance ? widget.appearance.backgroundColor : '#ffffff',
                },
                title: {
                    text: widget.title,
                    style: {
                        color: widget.appearance ? widget.appearance.textColor : '#333333',
                        fontSize: widget.appearance ? this.getFontSizeInPixels(widget.appearance.fontSize) : '14px'
                    }
                },
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: widget.appearance && widget.appearance.showLegend
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: widget.appearance && widget.appearance.showValues,
                            color: widget.appearance ? widget.appearance.textColor : '#333333'
                        }
                    }
                },
                colors: widget.appearance ? this.getColorTheme(widget.appearance.colorTheme) : null
            };

            // Configuración especial para gráficos circulares
            if (widget.visualization === 'pie') {
                // Para gráficos circulares, necesitamos formatear los datos de manera diferente
                const pieData = [];

                if (data.categories && data.categories.length > 0 &&
                    data.series && data.series.length > 0 &&
                    data.series[0].data) {

                    for (let i = 0; i < data.categories.length; i++) {
                        pieData.push({
                            name: data.categories[i],
                            y: data.series[0].data[i]
                        });
                    }

                    chartOptions.series = [{
                        name: data.series[0].name,
                        colorByPoint: true,
                        data: pieData
                    }];

                    chartOptions.plotOptions.pie = {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    };

                    // Para gráficos circulares no necesitamos ejes
                    delete chartOptions.xAxis;
                    delete chartOptions.yAxis;
                } else {
                    console.error("No hay datos suficientes para un gráfico circular");
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = `
          <div class="alert alert-warning">
            <v-icon class="me-2">mdi-alert</v-icon>
            No hay datos suficientes para mostrar el gráfico circular.
          </div>
        `;
                    }
                    return;
                }
            } else {
                // Configuración normal para otros tipos de gráficos
                chartOptions.xAxis = {
                    categories: data.categories,
                    labels: {
                        style: {
                            color: widget.appearance ? widget.appearance.textColor : '#333333'
                        }
                    }
                };

                chartOptions.yAxis = {
                    title: {
                        text: widget.metrics.join(', '),
                        style: {
                            color: widget.appearance ? widget.appearance.textColor : '#333333'
                        }
                    },
                    labels: {
                        style: {
                            color: widget.appearance ? widget.appearance.textColor : '#333333'
                        }
                    }
                };

                chartOptions.series = data.series;
            }

            try {
                Highcharts.chart(containerId, chartOptions);
                // console.log("Gráfico creado exitosamente");
            } catch (e) {
                console.error("Error al crear gráfico:", e);
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `
                    <div class="alert alert-danger">
                      <i class="me-2 mdi mdi-alert-circle"></i>
                      Error al crear el gráfico: ${e.message}
                    </div>
                  `;
                }
            }
        },
        // Renderiza una tabla de datos
        renderTable(containerId, data, widget) {
            // Obtener el contenedor con DOM nativo en lugar de jQuery
            const container = document.getElementById(containerId);
            if (!container) return;

            // Crear la estructura de la tabla con template string
            let tableHTML = `
                  <div class="v-table theme--light elevation-1 rounded">
                    <div class="v-table__wrapper">
                      <table>
                        <thead class="v-data-table-header">
                          <tr>
                `;

            // Añadir encabezados de dimensiones
            widget.dimensions.forEach(dimension => {
                tableHTML += `<th>${dimension}</th>`;
            });

            // Añadir encabezados de métricas
            widget.metrics.forEach(metric => {
                tableHTML += `<th>${metric}</th>`;
            });

            tableHTML += `
            </tr>
          </thead>
          <tbody>
      `;

            // Añadir filas de datos
            data.data.forEach(row => {
                tableHTML += '<tr>';

                // Añadir valores de dimensiones
                widget.dimensions.forEach(dimension => {
                    tableHTML += `<td>${row[dimension] || '-'}</td>`;
                });

                // Añadir valores de métricas
                widget.metrics.forEach(metric => {
                    const value = row[metric];
                    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                    tableHTML += `<td>${formattedValue || '-'}</td>`;
                });

                tableHTML += '</tr>';
            });

            tableHTML += `
      </tbody>
    </table>
  `;

            // Insertar la tabla en el contenedor
            container.innerHTML = tableHTML;

            // Inicializar DataTable si está disponible
            this.$nextTick(() => {
                const tableEl = container.querySelector('table');
                if (tableEl && window.$.fn && window.$.fn.DataTable) {
                    window.$(tableEl).DataTable({
                        responsive: true,
                        dom: 'Bfrtip',
                        buttons: ['copy', 'excel', 'pdf'],
                        pageLength: 5,
                        lengthMenu: [5, 10, 25, 50]
                    });
                }
            });
        },
        // Renderiza tarjetas de métricas
        renderCards(containerId, data, widget) {
            // Obtener el contenedor con DOM nativo en lugar de jQuery
            const container = document.getElementById(containerId);
            if (!container) return;

            // Crear el HTML para las tarjetas
            let cardsHTML = '<div class="row">';

            // Para cada métrica, crear una tarjeta
            widget.metrics.forEach(metric => {
                const metricData = data.data[metric] || {};
                const value = metricData.sum || 0;
                const formattedValue = value.toFixed(2);

                cardsHTML += `
                      <div class="col-xs-6">
                        <div class="metric-card">
                          <div class="metric-icon"><i class="mdi mdi-${this.getIconForMetric(metric)}"></i></div>
                          <div class="metric-value">${formattedValue}</div>
                          <div class="metric-name">${metric}</div>
                        </div>
                      </div>
                    `;
            });

            cardsHTML += '</div>';

            // Añadir información adicional si hay espacio
            if (data.count) {
                cardsHTML += `
      <div class="text-center text-muted">
        <small>Total registros: ${data.count}</small>
      </div>
    `;
            }

            // Insertar las tarjetas en el contenedor
            container.innerHTML = cardsHTML;

            // Aplicar estilos a las tarjetas
            this.$nextTick(() => {
                const cards = container.querySelectorAll('.metric-card');
                cards.forEach(card => {
                    card.style.backgroundColor = widget.appearance.backgroundColor;
                    card.style.color = widget.appearance.textColor;
                });
            });
        },

        // Método auxiliar para obtener el ícono correspondiente a cada métrica
        getIconForMetric(metric) {
            const lowerMetric = metric.toLowerCase();

            if (lowerMetric.includes('tot') || lowerMetric.includes('sum')) {
                return 'currency-usd';
            } else if (lowerMetric.includes('cost') || lowerMetric.includes('cst')) {
                return 'cash';
            } else if (lowerMetric.includes('cant') || lowerMetric.includes('count')) {
                return 'pound';
            } else if (lowerMetric.includes('kardex')) {
                return 'cube';
            } else if (lowerMetric.includes('fecha') || lowerMetric.includes('date')) {
                return 'calendar';
            } else {
                return 'chart-bar';
            }
        },

        // Devuelve un array de colores según el tema seleccionado
        getColorTheme(theme) {
            const themes = {
                'default': ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
                'pastel': ['#abd9e9', '#c2e699', '#ffffcc', '#fdae6b', '#e6f5c9', '#f4d9c6', '#edf8b1', '#c7e9b4', '#e7d4e8', '#ccebc5'],
                'bright': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
                'dark': ['#003366', '#336699', '#6699cc', '#9999cc', '#99ccff', '#666666', '#333333', '#000000', '#663366', '#996699'],
                'gradient': ['#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800']
            };

            return themes[theme] || themes['default'];
        },

        getFontSizeInPixels(size) {
            const sizes = {
                'small': '11px',
                'medium': '14px',
                'large': '18px'
            };

            return sizes[size] || sizes['medium'];
        },

        updateNoWidgetsMessage() {
            const hasWidgets = Object.keys(this.widgets).length > 0;

            // En Vue, podemos usar una propiedad reactiva para controlar la visibilidad
            this.showNoWidgetsMessage = !hasWidgets;

            // Si necesitas manipular el DOM directamente (como alternativa)
            this.$nextTick(() => {
                const messageEl = document.getElementById('no-widgets-message');
                if (messageEl) {
                    messageEl.style.display = hasWidgets ? 'none' : 'block';
                }
            });
        },
        updateDashboardTitle() {
            // En Vue, podemos usar una propiedad reactiva
            this.dashboardTitle = this.dashboardName || 'Dashboard sin título';

            // Si necesitas manipular el DOM directamente (como alternativa)
            this.$nextTick(() => {
                const titleEl = document.getElementById('dashboard-title');
                if (titleEl) {
                    titleEl.textContent = this.dashboardName || 'Dashboard sin título';
                }
            });
        },

        // Manejo de dimensiones y métricas
        addDimension() {
            if (this.availableDimensionsSelected.length === 0) return;

            // Añadir dimensiones seleccionadas
            this.availableDimensionsSelected.forEach(dim => {
                if (!this.widgetSettings.dimensions.includes(dim)) {
                    this.widgetSettings.dimensions.push(dim);
                }
            });

            // Limpiar selección
            this.availableDimensionsSelected = [];
        },

        removeDimension() {
            if (this.selectedDimensionsSelected.length === 0) return;

            // Filtrar dimensiones para eliminar las seleccionadas
            this.widgetSettings.dimensions = this.widgetSettings.dimensions.filter(
                dim => !this.selectedDimensionsSelected.includes(dim)
            );

            // Limpiar selección
            this.selectedDimensionsSelected = [];
        },

        addMetric() {
            if (this.availableMetricsSelected.length === 0) return;

            // Añadir métricas seleccionadas
            this.availableMetricsSelected.forEach(metric => {
                if (!this.widgetSettings.metrics.includes(metric)) {
                    this.widgetSettings.metrics.push(metric);
                }
            });

            // Limpiar selección
            this.availableMetricsSelected = [];
        },

        removeMetric() {
            if (this.selectedMetricsSelected.length === 0) return;

            // Filtrar métricas para eliminar las seleccionadas
            this.widgetSettings.metrics = this.widgetSettings.metrics.filter(
                metric => !this.selectedMetricsSelected.includes(metric)
            );

            // Limpiar selección
            this.selectedMetricsSelected = [];
        },

        // Manejo de JSON
        toggleJsonEdit() {
            if (this.editingJson) {
                // Guardar configuración desde JSON
                try {
                    const config = JSON.parse(this.widgetConfigJson);

                    // Preservar posición y tamaño
                    const originalWidget = this.widgets[this.currentWidgetId];
                    config.position = originalWidget.position;
                    config.width = originalWidget.width;
                    config.height = originalWidget.height;

                    // Actualizar configuración
                    this.widgetSettings = config;
                    this.editingJson = false;
                } catch (e) {
                    alert('JSON inválido: ' + e.message);
                    return;
                }
            } else {
                // Activar edición de JSON
                this.editingJson = true;
            }
        },

        // Manejo de plantillas
        applyTemplate() {

            const templateId = this.selectedTemplate;

            if (!templateId) return;

            // Buscar plantilla
            const template = this.getTemplateById(templateId);

            if (!template) {
                console.error('Plantilla no encontrada:', templateId);
                return;
            }

            // Confirmar si ya hay widgets
            if (Object.keys(this.widgets).length > 0) {
                this.confirmClearDialog = true;
            } else {
                this.applyTemplateLayout(template);
            }
        },

        // Obtiene una plantilla por ID
        getTemplateById(templateId) {
            // Mapeo de plantillas (simplificado para el ejemplo)
            const templates = {
                'single': {
                    layout: [
                        {
                            type: 'chart',
                            width: 12,
                            height: 8,
                            position: {row: 0, col: 0}
                        }
                    ]
                },
                'two-columns': {
                    layout: [
                        {
                            type: 'chart',
                            width: 6,
                            height: 8,
                            position: {row: 0, col: 0}
                        },
                        {
                            type: 'chart',
                            width: 6,
                            height: 8,
                            position: {row: 0, col: 6}
                        }
                    ]
                },
                'dashboard': {
                    layout: [
                        {
                            type: 'card',
                            width: 3,
                            height: 2,
                            position: {row: 0, col: 0}
                        },
                        {
                            type: 'card',
                            width: 3,
                            height: 2,
                            position: {row: 0, col: 3}
                        },
                        {
                            type: 'card',
                            width: 3,
                            height: 2,
                            position: {row: 0, col: 6}
                        },
                        {
                            type: 'card',
                            width: 3,
                            height: 2,
                            position: {row: 0, col: 9}
                        },
                        {
                            type: 'chart',
                            width: 8,
                            height: 6,
                            position: {row: 2, col: 0}
                        },
                        {
                            type: 'pie',
                            width: 4,
                            height: 6,
                            position: {row: 2, col: 8}
                        },
                        {
                            type: 'table',
                            width: 12,
                            height: 4,
                            position: {row: 8, col: 0}
                        }
                    ]
                },
                'report': {
                    layout: [
                        {
                            type: 'chart',
                            width: 12,
                            height: 4,
                            position: {row: 0, col: 0}
                        },
                        {
                            type: 'chart',
                            width: 6,
                            height: 4,
                            position: {row: 4, col: 0}
                        },
                        {
                            type: 'pie',
                            width: 6,
                            height: 4,
                            position: {row: 4, col: 6}
                        },
                        {
                            type: 'table',
                            width: 12,
                            height: 4,
                            position: {row: 8, col: 0}
                        }
                    ]
                }
            };

            return templates[templateId];
        },

        // Aplica una plantilla al layout
        applyTemplateLayout(template) {
            // Limpiar layout actual
            this.clearLayout();

            // Añadir widgets de la plantilla
            template.layout.forEach(item => {
                const widgetId = this.addWidget(item.type);
                const widget = this.widgets[widgetId];

                // Actualizar tamaño y posición
                const gridItem = document.querySelector(`.grid-stack-item[data-widget-id="${widgetId}"]`);

                if (gridItem && this.gridInstance) {
                    this.gridInstance.update(gridItem, {
                        x: item.position.col,
                        y: item.position.row,
                        w: item.width,
                        h: item.height
                    });

                    // Actualizar en el objeto widget
                    widget.position = {
                        row: item.position.row,
                        col: item.position.col
                    };
                    widget.width = item.width;
                    widget.height = item.height;
                }
            });
        },

        // Confirma limpiar el layout
        confirmClearLayout() {
            this.confirmClearDialog = true;
        },

        // Limpia todos los widgets
        clearLayout() {
            if (this.gridInstance) {
                this.gridInstance.removeAll();
            }

            this.widgets = {};
            this.nextWidgetId = 1;
            this.confirmClearDialog = false;
        },

        // Actualiza las posiciones de los widgets
        updateWidgetsPositions(items) {
            if (!items) return;

            items.forEach(item => {
                const widgetId = item.el.getAttribute('data-widget-id');
                if (widgetId && this.widgets[widgetId]) {
                    const widget = this.widgets[widgetId];

                    widget.position = {
                        row: item.y,
                        col: item.x
                    };
                    widget.width = item.w;
                    widget.height = item.h;
                }
            });
        },

        // Obtiene la posición de un widget
        getWidgetPosition(element) {
            const x = parseInt(element.getAttribute('gs-x')) || 0;
            const y = parseInt(element.getAttribute('gs-y')) || 0;

            return {
                row: y,
                col: x
            };
        },

        // Manejo de arrastrar y soltar
        onDragStart(event, type) {
            event.dataTransfer.setData('text/plain', type);
            event.target.classList.add('dragging');
        },

        onDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            document.getElementById('layout-grid').classList.add('drop-target');
        },

        onDrop(event) {
            event.preventDefault();
            document.getElementById('layout-grid').classList.remove('drop-target');

            const type = event.dataTransfer.getData('text/plain');

            // Calcular posición relativa donde se soltó
            const gridRect = document.getElementById('layout-grid').getBoundingClientRect();
            const dropX = event.clientX - gridRect.left;
            const dropY = event.clientY - gridRect.top;

            // Convertir posición en coordenadas de grid
            const cellWidth = gridRect.width / 12; // Asumiendo una grid de 12 columnas
            const cellHeight = 80; // Altura de celda predefinida

            const gridX = Math.floor(dropX / cellWidth);
            const gridY = Math.floor(dropY / cellHeight);

            // Añadir widget en la posición donde se soltó
            this.addWidgetAtPosition(type, gridX, gridY);
        },

        // Añade un widget en una posición específica
        addWidgetAtPosition(type, x, y) {
            const widgetId = 'widget-' + this.nextWidgetId++;
            const title = this.getDefaultTitleForType(type);

            // Opciones predeterminadas según el tipo
            let width = 6;
            let height = 4;

            if (type === 'card') {
                width = 3;
                height = 2;
            } else if (type === 'table') {
                width = 12;
                height = 4;
            } else if (type === 'filter') {
                width = 3;
                height = 3;
            }

            // Añadir widget al grid

            const widgetNode = this.gridInstance.addWidget({
                x: x,
                y: y,
                w: width,
                h: height,
                el: this.createWidgetContent(widgetId, type, title, 0)
            });

            // Guardar configuración inicial del widget
            this.widgets[widgetId] = {
                id: widgetId,
                type: type,
                title: title,
                dimensions: [],
                metrics: [],
                filters: {
                    column: null,
                    values: []
                },
                date_range: {
                    column: null,
                    start: '',
                    end: ''
                },
                visualization: this.getDefaultVisualizationForType(type),
                width: width,
                height: height,
                position: this.getWidgetPosition(widgetNode),
                appearance: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    fontSize: 'medium',
                    colorTheme: 'default',
                    showLegend: true,
                    showValues: false
                },
                autoRefresh: false,
                refreshInterval: 60
            };
            // Actualizar mensajes y título
            this.updateNoWidgetsMessage();
            this.updateDashboardTitle();

            // Configurar eventos del widget
            this.$nextTick(() => {
                const $widgetEl = document.querySelector(`[data-widget-id="${widgetId}"]`);

                if ($widgetEl) {
                    // Evento de configuración al hacer clic en el botón
                    const $configBtn = $widgetEl.querySelector('.widget-settings');
                    if ($configBtn) {
                        $configBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.openWidgetSettings(widgetId);
                        });
                    }

                    // Evento para eliminar al hacer doble clic en encabezado
                    const $header = $widgetEl.querySelector('.widget-header');
                    if ($header) {
                        $header.addEventListener('dblclick', () => {
                            this.currentWidgetId = widgetId;
                            this.confirmDeleteDialog = true;
                        });
                    }
                }
            });

            // Abrir configuración automáticamente para el nuevo widget
            this.openWidgetSettings(widgetId);

            return widgetId;
        },

        // Guarda el layout completo
        saveLayout() {
            if (Object.keys(this.widgets).length === 0) {
                Swal.fire({
                    title: "¡ATENCIÓN!",
                    html: '<h5>No hay widgets para guardar. Por favor añada al menos un widget al dashboard.</h5>',
                    icon: 'warning'
                })
                return;
            }

            this.saveLayoutName = this.dashboardName;
            this.saveLayoutDialog = true;

        },
        togglePreviewMode() {
            this.isPreviewMode = !this.isPreviewMode;

            if (this.isPreviewMode) {
                // Modo vista previa
                this.$nextTick(() => {
                    // Ocultar botones de configuración
                    const settingsButtons = document.querySelectorAll('.widget-settings');
                    settingsButtons.forEach(button => {
                        button.style.display = 'none';
                    });

                    // Cambiar el cursor de los encabezados
                    const headers = document.querySelectorAll('.widget-header');
                    headers.forEach(header => {
                        header.style.cursor = 'default';
                    });

                    // Desactivar el grid
                    this.gridInstance.disable();

                    // Cambiar el texto del botón
                    const previewButton = document.getElementById('preview-layout');
                    if (previewButton) {
                        previewButton.innerHTML = '<i class="mdi mdi-pencil"></i> Editar Dashboard';
                    }

                    // Cargar datos para todos los widgets
                    Object.keys(this.widgets).forEach(widgetId => {
                        this.loadWidgetData(widgetId);
                    });
                });
            } else {
                // Modo edición
                this.$nextTick(() => {
                    // Mostrar botones de configuración
                    const settingsButtons = document.querySelectorAll('.widget-settings');
                    settingsButtons.forEach(button => {
                        button.style.display = ''; // Puede ser que aquí esté el problema
                    });

                    // Cambiar el cursor de los encabezados
                    const headers = document.querySelectorAll('.widget-header');
                    headers.forEach(header => {
                        header.style.cursor = 'move';
                    });

                    // Activar el grid
                    this.gridInstance.enable();

                    // Cambiar el texto del botón
                    const previewButton = document.getElementById('preview-layout');
                    if (previewButton) {
                        previewButton.innerHTML = '<i class="mdi mdi-eye"></i> Vista Previa';
                    }
                });
            }
        },

        // Confirma guardar el layout
        confirmSaveLayout() {
            if (!this.saveLayoutName) {
                Swal.fire({
                    title: "¡ATENCIÓN!",
                    html: "<h5>Por favor ingrese un nombre para el dashboard.</h5>",
                    icon: "warning"
                });
                return;
            }

            const layoutConfig = {
                name: this.saveLayoutName,
                description: this.saveLayoutDescription,
                is_public: this.saveLayoutPublic ? 1 : 0,
                widgets: this.widgets,
                layout: this.getLayoutConfig()
            };

            axios.post('/dashboard/save', {
                layout_config: layoutConfig
            })
                .then(response => {
                    const data = response.data;

                    if (data.success) {
                        // console.log(data);

                        // En Vue, para cerrar un diálogo de Vuetify
                        this.saveLayoutDialog = false;

                        // Mostrar mensaje de éxito
                        Swal.fire({
                            title: "Ok",
                            html: "<h5>Dashboard guardado exitosamente.</h5>",
                            icon: "success"
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = '/dashboard/viewPreview/' + data.layout_id;
                            }
                        });

                    } else {
                        Swal.fire({
                            title: "Ok",
                            html: `<h5>Error al guardar el dashboard: ${data.message}|| 'Error desconocido')</h5> `,
                            icon: "error"
                        });
                    }
                })
                .catch(error => {
                    console.error('Error en la petición:', error);
                    alert('Error de comunicación con el servidor.');
                });

            // Cerrar diálogo
            this.saveLayoutDialog = false;

            // Actualizar nombre del dashboard
            this.dashboardName = this.saveLayoutName;
        },

        // Obtiene la configuración actual del layout
        getLayoutConfig() {
            const items = this.gridInstance.getGridItems();
            const config = [];

            items.forEach(item => {

                const widgetId = item.gridstackNode.el.getAttribute('data-widget-id');
                const widget = this.widgets[widgetId];

                if (widget) {
                    // Actualizar posición y tamaño
                    widget.position = this.getWidgetPosition(item.gridstackNode.el);
                    widget.width = item.gridstackNode.w;
                    widget.height = item.gridstackNode.h;

                    config.push({
                        id: widgetId,
                        type: widget.type,
                        width: widget.width,
                        height: widget.height,
                        position: widget.position
                    });
                }
            });

            return config;
        },

        // Utilidades
        getDefaultTitleForType(type) {
            const titles = {
                'chart': 'Gráfico de Columnas',
                'pie': 'Gráfico Circular',
                'line': 'Gráfico de Líneas',
                'table': 'Tabla de Datos',
                'card': 'Tarjeta de Métricas',
                'filter': 'Panel de Filtros'
            };

            return titles[type] || 'Widget';
        },

        getDefaultVisualizationForType(type) {
            const visualizations = {
                'chart': 'column',
                'pie': 'pie',
                'line': 'line',
                'table': 'table',
                'card': 'card',
                'filter': 'filter'
            };

            return visualizations[type] || 'column';
        },

        getIconForType(type) {
            const icons = {
                'chart': '<i class="mdi mdi-chart-bar"></i>',
                'pie': '<i class="mdi mdi-chart-pie"></i>',
                'line': '<i class="mdi mdi-chart-line"></i>',
                'table': '<i class="mdi mdi-table"></i>',
                'card': '<i class="mdi mdi-card-text-outline"></i>',
                'filter': '<i class="mdi mdi-filter"></i>'
            };

            return icons[type] || '<i class="mdi mdi-view-dashboard"></i>';
        },
        getIconClassForType(type) {
            const icons = {
                'chart': 'chart-bar',
                'pie': 'chart-pie',
                'line': 'chart-line',
                'table': 'table',
                'card': 'card-text-outline',
                'filter': 'filter'
            };

            return icons[type] || 'view-grid';
        },
        initDraggableItems() {
            this.$nextTick(() => {
                const widgetTypeElements = document.querySelectorAll('.widget-type');

                widgetTypeElements.forEach(element => {
                    // Establecer el atributo draggable
                    element.setAttribute('draggable', 'true');

                    // Evento dragstart
                    element.addEventListener('dragstart', (event) => {
                        // Almacenar el tipo de widget que se está arrastrando
                        const widgetType = element.getAttribute('data-type');
                        event.dataTransfer.setData('text/plain', widgetType);

                        // Añadir una clase para indicar que se está arrastrando
                        element.classList.add('dragging');
                    });

                    // Evento dragend
                    element.addEventListener('dragend', () => {
                        // Quitar la clase al finalizar el arrastre
                        element.classList.remove('dragging');
                    });
                });
            });
        },

        initDropZone() {
            this.$nextTick(() => {
                const dropZone = document.getElementById('layout-grid');
                if (!dropZone) return;

                // Evento dragover
                dropZone.addEventListener('dragover', (event) => {
                    // Prevenir el comportamiento predeterminado para permitir el drop
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';

                    // Añadir una clase para indicar que es una zona válida
                    dropZone.classList.add('drop-target');
                });

                // Evento dragleave
                dropZone.addEventListener('dragleave', () => {
                    // Quitar la clase cuando el elemento arrastrado sale de la zona
                    dropZone.classList.remove('drop-target');
                });

                // Evento drop
                dropZone.addEventListener('drop', (event) => {
                    // Prevenir la acción predeterminada
                    event.preventDefault();

                    // Quitar la clase de zona de destino
                    dropZone.classList.remove('drop-target');

                    // Obtener el tipo de widget
                    const widgetType = event.dataTransfer.getData('text/plain');

                    // Calcular posición relativa donde se soltó
                    const gridRect = dropZone.getBoundingClientRect();
                    const dropX = event.clientX - gridRect.left;
                    const dropY = event.clientY - gridRect.top;

                    // Convertir posición en coordenadas de grid
                    // Esto dependerá de cómo GridStack maneja las coordenadas
                    const cellWidth = gridRect.width / 12; // Asumiendo una grid de 12 columnas
                    const cellHeight = 80; // Altura de celda predefinida

                    const gridX = Math.floor(dropX / cellWidth);
                    const gridY = Math.floor(dropY / cellHeight);

                    // Añadir widget en la posición donde se soltó
                    this.addWidgetAtPosition(widgetType, gridX, gridY);
                });
            });
        },
        exportDashboard() {
            // Lógica para exportar el dashboard
            alert('Función de exportación no implementada');
        },

        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;

            const container = document.getElementById('dashboard-container');

            if (this.isFullscreen) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        },

        logout() {
            // Implementar lógica de cierre de sesión
            alert('Función de logout no implementada');
        }

    }

}
