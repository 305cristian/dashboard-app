<template>

    <div class="dashboard-container">
        <!-- Barra superior de acciones -->
        <div class="dashboard-header">
            <div>
                <h4><i class="fas fa-th-large"></i> Editor de Dashboard Múltiple</h4>
            </div>
            <div>
                <button
                    class="btn btn-success btn-sm me-2"
                    @click="showSaveDialog = true"
                >
                    <i class="fas fa-save me-1"></i> Guardar Dashboard
                </button>
                <button
                    class="btn btn-outline-secondary btn-sm"
                    @click="togglePreviewMode"
                >
                    <i class="fas fa-eye me-1"></i> Vista Previa
                </button>
            </div>
        </div>

        <!-- Contenedor principal -->
        <div class="dashboard-main d-flex">
            <!-- Panel de herramientas lateral -->
            <div class="tools-panel">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Nombre del Dashboard:</h5>
                    </div>
                    <div class="card-body">
                        <input
                            type="text"
                            class="form-control"
                            v-model="dashboardName"
                            placeholder="Ingrese un nombre descriptivo"
                            @input="updateDashboardTitle"
                        >
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-plus-circle me-2"></i> Añadir Elementos
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group widget-types">
                            <a
                                v-for="(widget, index) in availableWidgets"
                                :key="index"
                                href="#"
                                class="list-group-item list-group-item-action widget-type"
                                :data-type="widget.type"
                                @click.prevent="addWidget(widget.type)"
                            >
                                <i :class="widget.icon + ' me-2'"></i> {{ widget.title }}
                            </a>
                        </div>
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-th me-2"></i> Plantillas de Layout
                        </h5>
                    </div>
                    <div class="card-body">
                        <select
                            class="form-select mb-3"
                            v-model="selectedTemplate"
                        >
                            <option value="">-- Seleccionar plantilla --</option>
                            <option
                                v-for="template in layoutTemplates"
                                :key="template.id"
                                :value="template.id"
                            >
                                {{ template.name }}
                            </option>
                        </select>

                        <div v-if="templateDescription" class="alert alert-info mt-2 mb-3 py-2 small">
                            {{ templateDescription }}
                        </div>

                        <button
                            class="btn btn-primary btn-sm w-100"
                            :disabled="!selectedTemplate"
                            @click="applyTemplate"
                        >
                            <i class="fas fa-check me-1"></i> Aplicar Plantilla
                        </button>
                    </div>
                </div>

                <button
                    class="btn btn-danger w-100 mt-3"
                    @click="confirmClearLayout"
                >
                    <i class="fas fa-trash me-1"></i> Limpiar Todo
                </button>
            </div>

            <!-- Área de diseño del dashboard -->
            <div class="grid-content">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-tachometer-alt me-1"></i> <span id="dashboard-title">{{ dashboardTitle }}</span>
                        </h5>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary" id="grid-view" @click="setViewMode('grid')">
                                <i class="fas fa-th-large"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="list-view" @click="setViewMode('list')">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="layout-grid" class="grid-stack">
                            <!-- Los widgets se añaden aquí dinámicamente -->
                        </div>

                        <div v-if="isGridEmpty" id="no-widgets-message" class="text-center my-5">
                            <h4><i class="fas fa-info-circle"></i> El dashboard está vacío</h4>
                            <p>Arrastra elementos desde la barra lateral o selecciona una plantilla para empezar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modales -->
        <!-- Modal para guardar layout -->
        <div class="modal fade" id="save-layout-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-save me-1"></i> Guardar Dashboard</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="save-layout-name" class="form-label">Nombre del Dashboard:</label>
                            <input type="text" class="form-control" id="save-layout-name" v-model="saveLayoutName">
                        </div>
                        <div class="mb-3">
                            <label for="save-layout-description" class="form-label">Descripción (opcional):</label>
                            <textarea class="form-control" id="save-layout-description" rows="3" v-model="saveLayoutDescription"></textarea>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="save-layout-public" v-model="saveLayoutPublic">
                                <label class="form-check-label" for="save-layout-public">
                                    Hacer público este dashboard
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirm-save-layout" @click="saveLayout">Guardar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de confirmación para limpiar layout -->
        <div class="modal fade" id="clear-layout-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar acción</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Está seguro que desea eliminar todos los widgets del dashboard?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" @click="clearLayout">Limpiar Todo</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script >

// Importar dependencias necesarias


import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'gridstack/dist/gridstack.css';

import 'jquery-ui/dist/jquery-ui.js';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { GridStack } from 'gridstack';
import { Modal } from 'bootstrap';
import 'highcharts/highcharts';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'datatables.net-bs5';
import 'datatables.net-buttons-bs5';

// importaciones JS personalizados
 //import '../../../../assets/js/dashboard_layout.js';

export default {
    name: 'DashboardEditor',
    data() {
        return {
            dashboardName: '',
            saveLayoutName: '',
            saveLayoutDescription: '',
            saveLayoutPublic: false,
            selectedTemplate: '',
            isGridEmpty: true,
            showSaveDialog: false,
            gridInstance: null,
            widgets: {},
            nextWidgetId: 1,

            availableWidgets: [
                { type: 'chart', title: 'Gráfico', icon: 'fas fa-chart-bar' },
                { type: 'pie', title: 'Gráfico Circular', icon: 'fas fa-chart-pie' },
                { type: 'line', title: 'Gráfico de Líneas', icon: 'fas fa-chart-line' },
                { type: 'table', title: 'Tabla de Datos', icon: 'fas fa-table' },
                { type: 'card', title: 'Tarjeta de Métricas', icon: 'fas fa-id-card' },
                { type: 'filter', title: 'Panel de Filtros', icon: 'fas fa-filter' }
            ],
            layoutTemplates: [
                { id: 'single', name: 'Una visualización', description: 'Dashboard con una única visualización a pantalla completa' },
                { id: 'two-columns', name: 'Dos columnas', description: 'Dashboard con dos visualizaciones lado a lado' },
                { id: 'dashboard', name: 'Dashboard completo', description: 'Dashboard con tarjetas de resumen y gráficos detallados' },
                { id: 'report', name: 'Informe ejecutivo', description: 'Layout para informes con gráficos y tablas de datos' }
            ]
        };
    },
    computed: {
        dashboardTitle() {
            return this.dashboardName || 'Dashboard APP';
        },
        templateDescription() {
            if (!this.selectedTemplate) return '';

            const template = this.layoutTemplates.find(t => t.id === this.selectedTemplate);
            return template ? template.description : '';
        }
    },
    mounted() {
        this.initGridStack();

        // Inicializar modales de Bootstrap
        const saveLayoutModal = new Modal(document.getElementById('save-layout-modal'));
        const clearLayoutModal = new Modal(document.getElementById('clear-layout-modal'));

        // Observar cambios en el grid
        const observer = new MutationObserver(this.checkGridEmpty);
        observer.observe(document.getElementById('layout-grid'), {
            childList: true,
            subtree: true
        });

        // Comprobar estado inicial
        this.checkGridEmpty();
    },
    methods: {
        initGridStack() {
            // Opciones para GridStack
            const options = {
                cellHeight: 80,
                margin: 10,
                float: false,
                disableOneColumnMode: false,
                animate: true,
                resizable: {
                    handles: 'e, se, s, sw, w'
                }
            };

            this.gridInstance = GridStack.init(options, '#layout-grid');

            // Evento cuando un widget cambia de tamaño o posición
            this.gridInstance.on('change', (event, items) => {
                this.updateWidgetsPositions(items);
            });
        },

        updateDashboardTitle() {
            document.getElementById('dashboard-title').textContent = this.dashboardTitle;
        },

        addWidget(type) {
            // Implementar lógica de addWidget del archivo original
            console.log('Añadiendo widget de tipo:', type);

            // Ejemplo básico:
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
                content: this.createWidgetContent(widgetId, type, title)
            });

            // Guardar configuración inicial del widget
            this.widgets[widgetId] = {
                id: widgetId,
                type: type,
                title: title,
                // ... más propiedades según tu lógica original
            };

            this.checkGridEmpty();
        },

        createWidgetContent(widgetId, type, title) {
            // Crear el contenido HTML del widget
            return `
        <div class="card h-100" data-widget-id="${widgetId}">
          <div class="card-header d-flex justify-content-between align-items-center widget-header">
            <div>
              <i class="${this.getIconClassForType(type)}"></i>
              <span class="widget-title">${title}</span>
            </div>
            <button class="btn btn-sm btn-outline-secondary widget-settings">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="card-body widget-content">
            <div class="text-center widget-placeholder">
              <i class="${this.getIconClassForType(type)} fa-3x text-muted mb-2"></i>
              <p class="text-muted">Configure este widget para ver datos</p>
            </div>
          </div>
        </div>
      `;
        },

        applyTemplate() {
            // Implementar lógica de applyTemplate
            console.log('Aplicando plantilla:', this.selectedTemplate);

            // Ejemplo básico:
            // Aquí deberías implementar la lógica para aplicar la plantilla seleccionada

            this.checkGridEmpty();
        },

        confirmClearLayout() {
            // Mostrar modal de confirmación
            const clearLayoutModal = new bootstrap.Modal(document.getElementById('clear-layout-modal'));
            clearLayoutModal.show();
        },

        clearLayout() {
            // Limpiar el grid
            this.gridInstance.removeAll();
            this.widgets = {};
            this.nextWidgetId = 1;
            this.checkGridEmpty();

            // Cerrar modal
            const clearLayoutModal = bootstrap.Modal.getInstance(document.getElementById('clear-layout-modal'));
            clearLayoutModal.hide();
        },

        saveLayout() {
            // Implementar lógica para guardar el layout
            console.log('Guardando layout:', {
                name: this.saveLayoutName,
                description: this.saveLayoutDescription,
                isPublic: this.saveLayoutPublic,
                widgets: this.widgets
            });

            // Cerrar modal
            const saveLayoutModal = bootstrap.Modal.getInstance(document.getElementById('save-layout-modal'));
            saveLayoutModal.hide();
        },

        setViewMode(mode) {
            const gridElement = document.getElementById('layout-grid');
            const gridViewBtn = document.getElementById('grid-view');
            const listViewBtn = document.getElementById('list-view');

            if (mode === 'grid') {
                gridElement.classList.remove('list-view');
                gridElement.classList.add('grid-view');
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            } else {
                gridElement.classList.remove('grid-view');
                gridElement.classList.add('list-view');
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
            }
        },

        togglePreviewMode() {
            // Implementar lógica para alternar el modo de vista previa
            console.log('Alternando modo de vista previa');
        },

        checkGridEmpty() {
            // Comprobar si hay widgets en el grid
            this.isGridEmpty = document.getElementById('layout-grid').children.length === 0;
        },

        updateWidgetsPositions(items) {
            // Actualizar las posiciones de los widgets
            if (!items) return;

            items.forEach(item => {
                const widgetId = item.el.getAttribute('data-widget-id');
                if (widgetId && this.widgets[widgetId]) {
                    const widget = this.widgets[widgetId];

                    // Actualizar posición y tamaño
                    widget.position = {
                        row: item.y,
                        col: item.x
                    };
                    widget.width = item.w;
                    widget.height = item.h;
                }
            });
        },

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

        getIconClassForType(type) {
            const icons = {
                'chart': 'fas fa-chart-bar',
                'pie': 'fas fa-chart-pie',
                'line': 'fas fa-chart-line',
                'table': 'fas fa-table',
                'card': 'fas fa-id-card',
                'filter': 'fas fa-filter'
            };

            return icons[type] || 'fas fa-th';
        }
    }
};
</script>

<style>
/* Estilos principales */
.dashboard-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.dashboard-header {
    background: white;
    border-bottom: 1px solid #eee;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dashboard-main {
    flex-grow: 1;
    overflow: hidden;
}

.tools-panel {
    width: 320px;
    border-right: 1px solid #eee;
    overflow-y: auto;
    padding: 20px;
}

.grid-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

/* Estilos para GridStack */
.grid-stack {
    background: #f9f9f9;
    min-height: 600px;
    position: relative;
    padding: 10px;
    border-radius: 4px;
    border: 1px dashed #ddd;
}

.grid-stack-item {
    border-radius: 4px;
    overflow: hidden;
}

.grid-stack-item-content {
    background: #fff;
    color: #333;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 0;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.grid-stack-item:hover {
    z-index: 11;
}

/* Estilos para widgets */
.widget-header {
    cursor: move;
}

.widget-content {
    overflow: auto;
    flex-grow: 1;
    position: relative;
}

/* Estilos para elementos arrastrables */
.widget-type {
    transition: all 0.2s ease;
    cursor: grab;
}

.widget-type:hover {
    background-color: rgba(13, 110, 253, 0.05);
    transform: translateX(4px);
}

/* Estilos para la vista de lista */
.grid-stack.list-view {
    display: flex;
    flex-direction: column;
}

.grid-stack.list-view .grid-stack-item {
    width: 100% !important;
    margin-bottom: 15px;
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    transform: none !important;
}

.grid-stack.list-view .grid-stack-item-content {
    height: 300px !important;
}
</style>

