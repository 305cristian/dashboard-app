<template>
    <v-app>
        <!-- Navegación -->
        <v-app-bar app color="primary" dark>
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>
                <router-link to="/" class="text-decoration-none text-white">
                    Sistema de Dashboards FDN
                </router-link>
            </v-toolbar-title>
            <v-spacer></v-spacer>

            <!-- Menú de usuario -->
            <v-menu offset-y>
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-bind="props"
                        icon
                    >
                        <v-icon>mdi-account-circle</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item to="/profile">
                        <template v-slot:prepend>
                            <v-icon>mdi-account-circle</v-icon>
                        </template>
                        <v-list-item-title>Perfil</v-list-item-title>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item @click="logout">
                        <template v-slot:prepend>
                            <v-icon>mdi-logout</v-icon>
                        </template>
                        <v-list-item-title>Cerrar Sesión</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-app-bar>

        <!-- Navegación lateral -->
        <v-navigation-drawer v-model="drawer" app>
            <v-list density="compact">
                <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard"></v-list-item>
                <v-list-item to="/reports" prepend-icon="mdi-file-document" title="Reportes"></v-list-item>
                <v-list-item to="/settings" prepend-icon="mdi-cog" title="Configuración"></v-list-item>
            </v-list>
        </v-navigation-drawer>

        <!-- Contenido principal -->
        <v-main class="bg-grey-lighten-4">
            <v-container fluid>
                <v-card class="mb-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon class="me-2">mdi-view-dashboard</v-icon>
                        {{ layout.name }}
                        <v-spacer></v-spacer>

                        <v-btn
                            color="info"
                            variant="outlined"
                            prepend-icon="mdi-format-list-bulleted"
                            class="mx-2"
                            :href="route('dash.home')"
                        >
                            Ver Todos
                        </v-btn>



                        <v-btn
                            color="info"
                            variant="outlined"
                            prepend-icon="mdi-download"
                            class="mx-2"
                            @click="exportDashboard"
                        >
                            Exportar
                        </v-btn>

                        <v-btn
                            color="info"
                            variant="outlined"
                            :prepend-icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                            @click="toggleFullscreen"
                        >

                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <v-alert
                            v-if="layout.description"
                            type="info"
                            variant="tonal"
                            density="compact"
                            class="mb-4"
                        >
                            {{ layout.description }}
                        </v-alert>

                        <div id="dashboard-container" class="dashboard-view-container">
                            <div class="grid-stack" id="layout-grid">
                                <!-- Los widgets se cargan dinámicamente con GridStack -->
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-container>
        </v-main>

        <!-- Overlay de carga -->
        <v-overlay
            v-model="loading"
            :opacity="0.7"
            class="align-center justify-center"
        >
            <v-progress-circular
                indeterminate
                size="64"
                color="primary"
            ></v-progress-circular>
            <div class="text-center mt-4">Cargando dashboard...</div>
        </v-overlay>

        <!-- Footer -->
        <v-footer class="bg-white">
            <v-container fluid>
                <v-divider class="mb-4"></v-divider>
                <div class="d-flex flex-column flex-md-row">
                    <div>&copy; {{ new Date().getFullYear() }} Sistema de Reportería Dashboards</div>
                    <v-spacer></v-spacer>
                    <div>Desarrollado por <a href="#" target="_blank">CComputers</a></div>
                </div>
            </v-container>
        </v-footer>
    </v-app>
</template>

<script src="../../../../assets/js/dashboardLayout.js"></script>
<style src="../../../../assets/css/viewPreview.css"></style>
