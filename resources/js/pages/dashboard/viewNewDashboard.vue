<template>
    <v-app>
        <v-app-bar app :elevation="2" class="gradient-bar">
            <v-app-bar-title class="font-weight-bold">
                <v-icon size="large" class="me-2 animate-pulse">mdi-view-dashboard-variant</v-icon>
                Dashboard Analyzer
            </v-app-bar-title>
            <v-spacer></v-spacer>

            <div v-if="isAuthenticated">
                <v-btn class="mx-1" variant="text" :to="{ name: 'dashboard' }"
                       prepend-icon="mdi-monitor-dashboard">
                    Dashboard
                </v-btn>
                <v-btn class="mx-1" variant="text" :to="{ name: 'profile' }"
                       prepend-icon="mdi-account-circle">
                    Mi Perfil
                </v-btn>
            </div>
            <template v-else>
                <v-btn class="mx-1" variant="text" :href="route('dash.home')"
                       prepend-icon="mdi-login">
                    Home
                </v-btn>
                <v-btn class="mx-1" color="secondary" variant="elevated" :href="route('dash.upload') "
                       prepend-icon="mdi-file-excel">
                    Upload File
                </v-btn>
            </template>

            <v-btn class="ms-2" icon="mdi-theme-light-dark" @click="toggleTheme"></v-btn>
        </v-app-bar>
        <v-container fluid class="pa-0 pt-16">
            <v-row no-gutters>

                <!-- Área principal del dashboard editor -->
                <v-col cols="12">
                    <v-row no-gutters>
                        <!-- Panel lateral de herramientas -->
                        <v-col cols="12" md="3" class="border-end">
                            <v-card flat class="ma-0 pa-0 rounded-0 h-100">
                                <v-card-title class="d-flex align-center px-4 py-3">
                                    <v-icon class="me-2">mdi-tools</v-icon>
                                    <span class="text-subtitle-1 font-weight-medium">Herramientas</span>
                                </v-card-title>

                                <v-divider></v-divider>

                                <!-- Nombre del Dashboard -->
                                <div class="px-4 py-3">
                                    <div class="text-subtitle-2 mb-2">Nombre del Dashboard</div>
                                    <v-text-field
                                        v-model="dashboardName"
                                        variant="outlined"
                                        density="comfortable"
                                        placeholder="Ingrese un nombre descriptivo"
                                        hide-details
                                        class="mb-4"
                                    ></v-text-field>

                                    <!-- Añadir Elementos -->
                                    <div class="d-flex align-center mb-2">
                                        <v-icon size="small" class="me-2">mdi-plus-circle</v-icon>
                                        <span class="text-subtitle-2">Añadir Elementos</span>
                                    </div>

                                    <v-list density="compact" class="pa-0">
                                        <v-list-item
                                            v-for="(widget, index) in availableWidgets"
                                            :key="index"
                                            :title="widget.title"
                                            :prepend-icon="widget.icon"
                                            class="rounded-lg my-1 widget-item widget-type"
                                            :data-type="widget.type"
                                            link
                                            @click="addWidget(widget.type)"
                                            draggable
                                            @dragstart="onDragStart($event, widget.type)"
                                        ></v-list-item>
                                    </v-list>

                                    <!-- Plantillas de Layout -->
                                    <div class="d-flex align-center mt-4 mb-2">
                                        <v-icon size="small" class="me-2">mdi-view-grid</v-icon>
                                        <span class="text-subtitle-2">Plantillas de Layout</span>
                                    </div>

                                    <v-select
                                        v-model="selectedTemplate"
                                        :items="layoutTemplates"
                                        item-title="name"
                                        item-value="id"
                                        label="Seleccione una plantilla"
                                        variant="outlined"
                                        density="comfortable"
                                        class="mb-2"

                                    ></v-select>

                                    <v-expand-transition>
                                        <v-alert
                                            v-if="templateDescription"
                                            type="info"
                                            variant="tonal"
                                            density="compact"
                                            class="mt-2 text-caption"
                                        >
                                            {{ templateDescription }}
                                        </v-alert>
                                    </v-expand-transition>

                                    <v-btn
                                        block
                                        variant="tonal"
                                        color="primary"
                                        class="mt-3"
                                        size="small"
                                        prepend-icon="mdi-check"
                                        :disabled="!selectedTemplate"
                                        @click="applyTemplate"
                                    >
                                        Aplicar Plantilla
                                    </v-btn>

                                    <!-- Botón Limpiar Todo -->
                                    <v-btn
                                        block
                                        color="error"
                                        variant="flat"
                                        class="mt-6"
                                        prepend-icon="mdi-delete"
                                        @click="confirmClearLayout"
                                    >
                                        Limpiar Todo
                                    </v-btn>
                                </div>
                            </v-card>
                        </v-col>

                        <!-- Área de diseño del dashboard -->
                        <v-col cols="12" md="9">
                            <v-card flat class="ma-0 pa-0 rounded-0 h-100" min-height="600">
                                <v-toolbar density="compact" color="grey-lighten-4" class="border-bottom">
                                    <v-toolbar-title class="d-flex align-center">
                                        <v-icon class="me-2">mdi-view-dashboard</v-icon>
                                        <span>{{ dashboardTitle }}</span>
                                    </v-toolbar-title>

                                    <v-spacer></v-spacer>
                                    <v-btn color="success" @click="saveLayout()" class="mx-2" prepend-icon="mdi-content-save">
                                        Guardar Dashboard
                                    </v-btn>
                                    <v-btn color="info" @click="togglePreviewMode()" class="mx-2" id="preview-layout" prepend-icon="mdi-eye">
                                        Vista Previa
                                    </v-btn>
                                    <v-btn-toggle v-model="viewMode" density="comfortable" color="primary">
                                        <v-btn value="grid" variant="text">
                                            <v-icon>mdi-view-grid</v-icon>
                                        </v-btn>
                                        <v-btn value="list" variant="text">
                                            <v-icon>mdi-format-list-bulleted</v-icon>
                                        </v-btn>
                                    </v-btn-toggle>

                                </v-toolbar>

                                <!-- Área de Grid -->
                                <div
                                    class="grid-stack  border"
                                    :class="{ 'list-view': viewMode === 'list', 'grid-view': viewMode === 'grid' }"
                                    id="layout-grid"
                                    @dragover.prevent="onDragOver">
<!--                                    @drop.prevent="onDrop"-->

                                    <!-- Los widgets se añaden aquí dinámicamente -->
                                    <template v-if="Object.keys(widgets).length === 0">
                                        <div class="text-center empty-dashboard py-12">
                                            <v-icon size="64" color="grey-lighten-1" class="mb-4">
                                                mdi-information-outline
                                            </v-icon>
                                            <h4 class="text-h6 font-weight-medium text-grey-darken-1">El dashboard está
                                                vacío</h4>
                                            <p class="text-body-2 text-grey">Arrastra elementos desde la barra lateral o
                                                selecciona una plantilla para empezar.</p>
                                        </div>
                                    </template>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <!-- Diálogo de Configuración de Widget -->
            <v-dialog v-model="widgetSettingsDialog" max-width="900">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon class="me-2">mdi-cog</v-icon>
                        Configuración de Visualización
                        <v-spacer></v-spacer>
                        <v-btn icon @click="widgetSettingsDialog = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-card-text>
                        <input type="hidden" v-model="currentWidgetId">
                        <input type="hidden" v-model="currentWidgetType">

                        <v-tabs v-model="activeTab" bg-color="transparent">
                            <v-tab value="data">
                                <v-icon class="me-2">mdi-database</v-icon>
                                Datos
                            </v-tab>
                            <v-tab value="appearance">
                                <v-icon class="me-2">mdi-palette</v-icon>
                                Apariencia
                            </v-tab>
                            <v-tab value="advanced">
                                <v-icon class="me-2">mdi-cogs</v-icon>
                                Avanzado
                            </v-tab>
                        </v-tabs>

                        <v-window v-model="activeTab" class="mt-4">
                            <!-- Tab de Datos -->
                            <v-window-item value="data">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="widgetSettings.title"
                                            label="Título"
                                            variant="outlined"
                                            density="comfortable"
                                            class="mb-4"
                                        ></v-text-field>

                                        <v-select
                                            v-model="widgetSettings.visualization"
                                            :items="visualizationTypes"
                                            label="Tipo de visualización"
                                            variant="outlined"
                                            density="comfortable"
                                            class="mb-4"
                                        ></v-select>

                                        <!-- Para las dimensiones -->
                                        <div class="text-subtitle-2 mb-1">Dimensiones disponibles:</div>
                                        <v-select
                                            v-model="availableDimensionsSelected"
                                            :items="availableDimensions"
                                            item-title="name"
                                            item-value="name"
                                            label="Seleccione dimensiones"
                                            variant="outlined"
                                            density="comfortable"
                                            multiple
                                            class="mb-2"
                                            :item-props="item => ({
                                                    'data-type': item.type
                                                })"
                                        ></v-select>

                                        <div class="text-center mb-2">
                                            <v-btn
                                                color="primary"
                                                size="small"
                                                variant="tonal"
                                                class="me-2"
                                                prepend-icon="mdi-arrow-down"
                                                @click="addDimension"
                                            >
                                                Agregar
                                            </v-btn>
                                            <v-btn
                                                color="error"
                                                size="small"
                                                variant="tonal"
                                                prepend-icon="mdi-arrow-up"
                                                @click="removeDimension"
                                            >
                                                Quitar
                                            </v-btn>
                                        </div>

                                        <div class="text-subtitle-2 mb-1">Dimensiones seleccionadas:</div>
                                        <v-select
                                            v-model="selectedDimensionsSelected"
                                            :items="widgetSettings.dimensions"
                                            label="Dimensiones actuales"
                                            variant="outlined"
                                            density="comfortable"
                                            multiple
                                            class="mb-2"
                                        ></v-select>
                                        <div class="text-caption text-grey mb-4">Seleccione categorías para agrupar los
                                            datos
                                        </div>
                                    </v-col>

                                    <v-col cols="12" md="6">
                                        <!-- Para las métricas -->
                                        <div class="text-subtitle-2 mb-1">Métricas disponibles:</div>
                                        <v-select
                                            v-model="availableMetricsSelected"
                                            :items="availableMetrics"
                                            item-title="name"
                                            item-value="name"
                                            label="Seleccione métricas"
                                            variant="outlined"
                                            density="comfortable"
                                            multiple
                                            class="mb-2"
                                            :item-props="item => ({
                                                    'data-type': item.type
                                                })"
                                        ></v-select>

                                        <div class="text-center mb-2">
                                            <v-btn
                                                color="primary"
                                                size="small"
                                                variant="tonal"
                                                class="me-2"
                                                prepend-icon="mdi-arrow-down"
                                                @click="addMetric"
                                            >
                                                Agregar
                                            </v-btn>
                                            <v-btn
                                                color="error"
                                                size="small"
                                                variant="tonal"
                                                prepend-icon="mdi-arrow-up"
                                                @click="removeMetric"
                                            >
                                                Quitar
                                            </v-btn>
                                        </div>

                                        <div class="text-subtitle-2 mb-1">Métricas seleccionadas:</div>
                                        <v-select
                                            v-model="selectedMetricsSelected"
                                            :items="widgetSettings.metrics"
                                            label="Métricas actuales"
                                            variant="outlined"
                                            density="comfortable"
                                            multiple
                                            class="mb-2"
                                        ></v-select>
                                        <div class="text-caption text-grey mb-4">Seleccione valores numéricos para
                                            mostrar
                                        </div>

                                        <v-select
                                            v-model="widgetSettings.aggregation"
                                            :items="aggregationTypes"
                                            label="Función de agregación"
                                            variant="outlined"
                                            density="comfortable"
                                            class="mb-4"
                                        ></v-select>

                                        <v-row>
                                            <v-col cols="12" sm="6">
                                                <v-text-field
                                                    v-model="widgetSettings.limit"
                                                    label="Límite de datos"
                                                    type="number"
                                                    variant="outlined"
                                                    density="comfortable"
                                                    min="1"
                                                    max="100"
                                                    class="mb-1"
                                                ></v-text-field>
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-select
                                                    v-model="widgetSettings.order"
                                                    :items="orderTypes"
                                                    label="Ordenar resultados"
                                                    variant="outlined"
                                                    density="comfortable"

                                                ></v-select>
                                            </v-col>
                                        </v-row>

                                        <div class="text-caption text-grey mb-4">Máximo número de resultados a mostrar
                                        </div>
                                    </v-col>
                                </v-row>

                                <!-- Filtros (colapsable) -->
                                <v-expansion-panels variant="accordion" class="mb-4">
                                    <v-expansion-panel>
                                        <v-expansion-panel-title>
                                            <v-icon class="me-2">mdi-filter</v-icon>
                                            Filtros
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            <v-row>
                                                <v-col cols="12" md="6">
                                                    <v-select
                                                        v-model="widgetSettings.filters.column"
                                                        :items="availableDimensions"
                                                        item-title="name"
                                                        label="Columna para filtrar"
                                                        variant="outlined"
                                                        density="comfortable"
                                                        clearable
                                                        class="mb-4"
                                                    ></v-select>
                                                </v-col>
                                                <v-col cols="12" md="6">
                                                    <v-select
                                                        v-model="widgetSettings.filters.values"
                                                        :items="filterValues"
                                                        label="Valores a incluir"
                                                        variant="outlined"
                                                        density="comfortable"
                                                        multiple
                                                        class="mb-4"
                                                    ></v-select>
                                                </v-col>
                                            </v-row>

                                            <v-row>
                                                <v-col cols="12" md="6">
                                                    <v-select
                                                        v-model="widgetSettings.date_range.column"
                                                        :items="dateDimensions"
                                                        label="Rango de fechas"
                                                        variant="outlined"
                                                        density="comfortable"
                                                        clearable
                                                        class="mb-4"
                                                    ></v-select>
                                                </v-col>
                                                <v-col cols="12" md="6">
                                                    <div class="d-flex">
                                                        <v-text-field
                                                            v-model="widgetSettings.date_range.start"
                                                            label="Fecha inicio"
                                                            type="date"
                                                            variant="outlined"
                                                            density="comfortable"
                                                            class="me-2"
                                                        ></v-text-field>
                                                        <v-text-field
                                                            v-model="widgetSettings.date_range.end"
                                                            label="Fecha fin"
                                                            type="date"
                                                            variant="outlined"
                                                            density="comfortable"
                                                        ></v-text-field>
                                                    </div>
                                                </v-col>
                                            </v-row>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </v-window-item>

                            <!-- Tab de Apariencia -->
                            <v-window-item value="appearance">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-color-picker
                                            v-model="widgetSettings.appearance.backgroundColor"
                                            label="Color de fondo"
                                            hide-inputs
                                            hide-canvas
                                            show-swatches
                                            swatches-max-height="300"
                                            class="mb-4"
                                        ></v-color-picker>

                                        <v-color-picker
                                            v-model="widgetSettings.appearance.textColor"
                                            label="Color del texto"
                                            hide-inputs
                                            hide-canvas
                                            show-swatches
                                            swatches-max-height="300"
                                            class="mb-4"
                                        ></v-color-picker>

                                        <v-select
                                            v-model="widgetSettings.appearance.fontSize"
                                            :items="fontSizes"
                                            label="Tamaño de fuente"
                                            variant="outlined"
                                            density="comfortable"
                                            class="mb-4"
                                        ></v-select>
                                    </v-col>

                                    <v-col cols="12" md="6">
                                        <v-select
                                            v-model="widgetSettings.appearance.colorTheme"
                                            :items="colorThemes"
                                            label="Tema de colores"
                                            variant="outlined"
                                            density="comfortable"
                                            class="mb-4"
                                        ></v-select>

                                        <v-checkbox
                                            v-model="widgetSettings.appearance.showLegend"
                                            label="Mostrar leyenda"
                                            class="mb-2"
                                        ></v-checkbox>

                                        <v-checkbox
                                            v-model="widgetSettings.appearance.showValues"
                                            label="Mostrar valores en el gráfico"
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </v-window-item>

                            <!-- Tab Avanzado -->
                            <v-window-item value="advanced">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="currentWidgetId"
                                            label="ID del Widget"
                                            variant="outlined"
                                            density="comfortable"
                                            readonly
                                            class="mb-4"
                                        ></v-text-field>

                                        <v-checkbox
                                            v-model="widgetSettings.autoRefresh"
                                            label="Actualización automática"
                                            class="mb-2"
                                        ></v-checkbox>

                                        <v-text-field
                                            v-model="widgetSettings.refreshInterval"
                                            label="Intervalo de actualización (segundos)"
                                            type="number"
                                            variant="outlined"
                                            density="comfortable"
                                            min="10"
                                            max="3600"
                                            class="mb-4"
                                        ></v-text-field>
                                    </v-col>

                                    <v-col cols="12" md="6">
                                        <v-textarea
                                            v-model="widgetConfigJson"
                                            label="JSON de configuración"
                                            variant="outlined"
                                            rows="8"
                                            :readonly="!editingJson"
                                            class="mb-2 monospace"
                                        ></v-textarea>

                                        <v-btn
                                            size="small"
                                            variant="outlined"
                                            prepend-icon="mdi-code"
                                            @click="toggleJsonEdit"
                                        >
                                            {{ editingJson ? 'Guardar JSON' : 'Editar JSON' }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-window-item>
                        </v-window>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions>
                        <v-btn
                            color="error"
                            variant="text"
                            prepend-icon="mdi-delete"
                            @click="confirmDeleteWidget"
                        >
                            Eliminar Widget
                        </v-btn>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="secondary"
                            variant="text"
                            @click="widgetSettingsDialog = false"
                        >
                            Cancelar
                        </v-btn>
                        <v-btn
                            color="primary"
                            @click="saveWidgetSettings"
                        >
                            Guardar Cambios
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Diálogo para guardar el layout -->
            <v-dialog v-model="saveLayoutDialog" max-width="500">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon class="me-2">mdi-content-save</v-icon>
                        Guardar Dashboard
                    </v-card-title>

                    <v-card-text>
                        <v-text-field
                            v-model="saveLayoutName"
                            label="Nombre del Dashboard"
                            variant="outlined"
                            density="comfortable"
                            class="mb-4"
                        ></v-text-field>

                        <v-textarea
                            v-model="saveLayoutDescription"
                            label="Descripción (opcional)"
                            variant="outlined"
                            density="comfortable"
                            rows="3"
                            class="mb-4"
                        ></v-textarea>

                        <v-checkbox
                            v-model="saveLayoutPublic"
                            label="Hacer público este dashboard"
                        ></v-checkbox>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="secondary"
                            variant="text"
                            @click="saveLayoutDialog = false"
                        >
                            Cancelar
                        </v-btn>
                        <v-btn
                            color="primary"
                            @click="confirmSaveLayout"
                        >
                            Guardar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Diálogo de confirmación para eliminar widget -->
            <v-dialog v-model="confirmDeleteDialog" max-width="400">
                <v-card>
                    <v-card-title class="text-h6">
                        Confirmar eliminación
                    </v-card-title>
                    <v-card-text>
                        ¿Está seguro que desea eliminar este widget?
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="grey-darken-1"
                            variant="text"
                            @click="confirmDeleteDialog = false"
                        >
                            Cancelar
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="text"
                            @click="deleteWidget"
                        >
                            Eliminar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Diálogo de confirmación para limpiar layout -->
            <v-dialog v-model="confirmClearDialog" max-width="400">
                <v-card>
                    <v-card-title class="text-h6">
                        Confirmar acción
                    </v-card-title>
                    <v-card-text>
                        ¿Está seguro que desea eliminar todos los widgets del dashboard?
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                            color="grey-darken-1"
                            variant="text"
                            @click="confirmClearDialog = false"
                        >
                            Cancelar
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="text"
                            @click="clearLayout"
                        >
                            Limpiar Todo
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
    </v-app>

</template>

<script src="../../../../assets/js/dashboardLayout.js"></script>
<style src="../../../../assets/css/styles.css"></style>

