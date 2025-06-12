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
                <v-btn class="mx-1" variant="text" :to="{ name: 'login' }"
                       prepend-icon="mdi-login">
                    Login
                </v-btn>
                <v-btn class="mx-1" color="secondary" variant="elevated" :to="{ name: 'register' }"
                       prepend-icon="mdi-account-plus">
                    Registro
                </v-btn>
            </template>

            <v-btn class="ms-2" icon="mdi-theme-light-dark" @click="toggleTheme"></v-btn>
        </v-app-bar>

        <v-main class="bg-surface-variant-subtle">
            <v-container fluid class="fill-height">
                <v-row align="center" justify="center">
                    <v-col cols="12" md="10" lg="8">
                        <!-- Tarjeta principal con efectos de hover y sombras dinámicas -->
                        <v-card
                            :elevation="hovering ? 10 : 4"
                            :class="{'hover-scale': hovering}"
                            @mouseenter="hovering = true"
                            @mouseleave="hovering = false"
                            class="rounded-xl transition-smooth overflow-hidden"
                        >
                            <v-row>
                                <v-col cols="12" md="6" class="pa-8">
                                    <div class="d-flex align-center mb-4">
                                        <div class="pulse-dot me-3"></div>
                                        <h1 class="text-h3 font-weight-bold gradient-text">Data Insights</h1>
                                    </div>

                                    <h2 class="text-h6 font-weight-medium mb-6 text-grey-darken-1">
                                        Transforma tus datos en decisiones inteligentes con visualizaciones interactivas.
                                    </h2>

                                    <v-card class="feature-card mb-6" variant="outlined" rounded="xl">
                                        <v-list>
                                            <v-list-item v-for="(feature, index) in features" :key="index" class="feature-item">
                                                <template v-slot:prepend>
                                                    <v-avatar color="primary" class="feature-icon">
                                                        <v-icon :icon="feature.icon" color="white"></v-icon>
                                                    </v-avatar>
                                                </template>
                                                <v-list-item-title>
                                                    <span class="text-subtitle-1 font-weight-medium">{{ feature.title }}</span>
                                                </v-list-item-title>
                                                <v-list-item-subtitle>
                                                    {{ feature.subtitle }}
                                                </v-list-item-subtitle>
                                            </v-list-item>
                                        </v-list>
                                    </v-card>

                                    <v-row class="mt-6">
                                        <v-col cols="12" md="6">

                                            <v-btn
                                                :loading="loading"
                                                :disabled="loading"
                                                color="primary"
                                                size="x-large"
                                                block
                                                :href="route('dash.createDashboard')"
                                                class="py-3 text-subtitle-1 rounded-pill"
                                                elevation="3"
                                                @click="simulateLoading"
                                            >
                                                <v-icon start class="me-1">mdi-plus-circle</v-icon>
                                                Crear Dashboard
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-btn
                                                color="secondary"
                                                size="x-large"
                                                block
                                                :href="route('dash.upload')"
                                                class="py-3 text-subtitle-1 rounded-pill"
                                                variant="elevated"
                                            >
                                                <v-icon start class="me-1">mdi-file-upload</v-icon>
                                                Subir Excel
                                            </v-btn>
                                        </v-col>
                                    </v-row>



                                </v-col>

                                <v-col cols="12" md="6" class="position-relative pa-0">
                                    <v-img
                                        src="/images/dashboard-illustration.svg"
                                        alt="Dashboard Illustration"
                                        height="100%"
                                        cover
                                        class="rounded-e-xl"
                                    >
                                        <div class="d-flex flex-column fill-height justify-center align-center bg-animation">
                                            <!-- Decoración con formas flotantes -->
                                            <div class="floating-shape shape1"></div>
                                            <div class="floating-shape shape2"></div>
                                            <div class="floating-shape shape3"></div>

                                            <v-sheet
                                                class="pa-6 text-center rounded-xl mx-4 dashboard-preview"
                                                color="background"
                                                width="340"
                                                elevation="12"
                                            >
                                                <div class="text-h5 font-weight-bold text-primary mb-3">
                                                    <v-icon color="primary" class="me-2">mdi-chart-areaspline</v-icon>
                                                    Vista previa
                                                </div>

                                                <!-- Miniaturas de gráficos animados -->
                                                <div class="d-flex justify-space-between mb-4">
                                                    <v-sheet class="pa-2 rounded chart-mini mr-2" width="110" height="80" color="primary-lighten-4">
                                                        <div class="chart-animation bars"></div>
                                                    </v-sheet>
                                                    <v-sheet class="pa-2 rounded chart-mini mr-2" width="110" height="80" color="secondary-lighten-4">
                                                        <div class="chart-animation line"></div>
                                                    </v-sheet>
                                                    <v-sheet class="pa-2 rounded chart-mini" width="110" height="80" color="info-lighten-4">
                                                        <div class="chart-animation pie"></div>
                                                    </v-sheet>
                                                </div>

                                                <v-img
                                                    src="/images/dashboard-preview.png"
                                                    alt="Dashboard Preview"
                                                    height="180"
                                                    class="rounded-lg mb-4 preview-shadow"
                                                ></v-img>

                                                <v-btn
                                                    color="primary"
                                                    size="large"
                                                    block
                                                    class="text-button rounded-pill pulse-btn"
                                                    elevation="3"
                                                    :href="route('dash.home')"
                                                >
                                                    <v-icon start class="me-1">mdi-rocket-launch</v-icon>
                                                    Comenzar ahora
                                                </v-btn>
                                            </v-sheet>
                                        </div>
                                    </v-img>
                                </v-col>
                            </v-row>
                        </v-card>

                        <!-- Testimonios -->
                        <v-sheet class="mt-8 mb-6 px-4 py-2 rounded-lg bg-surface">
                            <v-carousel
                                show-arrows="hover"
                                hide-delimiters
                                height="160"
                                interval="7000"
                            >
                                <v-carousel-item v-for="(testimonial, i) in testimonials" :key="i">
                                    <v-sheet class="fill-height d-flex align-center justify-center">
                                        <div class="text-center px-10">
                                            <div class="text-h6 font-italic mb-2">"{{ testimonial.quote }}"</div>
                                            <v-rating
                                                model-value="5"
                                                color="amber"
                                                density="compact"
                                                size="small"
                                                readonly
                                                class="mb-1"
                                            ></v-rating>
                                            <div class="text-subtitle-2 font-weight-medium">{{ testimonial.author }}</div>
                                            <div class="text-caption text-grey-darken-1">{{ testimonial.position }}</div>
                                        </div>
                                    </v-sheet>
                                </v-carousel-item>
                            </v-carousel>
                        </v-sheet>

                        <!-- Footer mejorado -->
                        <v-card class="mt-4 rounded-xl" elevation="1">
                            <v-card-text>
                                <div class="d-flex flex-wrap justify-space-between align-center">
                                    <div class="d-flex align-center">
                                        <v-icon size="large" class="me-2">mdi-view-dashboard-variant</v-icon>
                                        <span class="text-subtitle-1 font-weight-medium">Dashboard Analyzer</span>
                                    </div>

                                    <div>
                                        <v-btn variant="text" href="https://vuetifyjs.com" target="_blank" class="footer-btn">
                                            <v-icon start>mdi-vuetify</v-icon>
                                            Vuetify
                                        </v-btn>
                                        <v-btn variant="text" href="https://laravel.com/docs" target="_blank" class="footer-btn">
                                            <v-icon start>mdi-laravel</v-icon>
                                            Docs
                                        </v-btn>
                                        <v-btn variant="text" href="https://laracasts.com" target="_blank" class="footer-btn">
                                            <v-icon start>mdi-video</v-icon>
                                            Laracasts
                                        </v-btn>
                                        <v-btn variant="text" href="https://github.com/laravel/laravel" target="_blank" class="footer-btn">
                                            <v-icon start>mdi-github</v-icon>
                                            GitHub
                                        </v-btn>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import {Link} from "@inertiajs/vue3";

export default {
    name: 'WelcomeDashboard',
    components: {Link},
    data() {
        return {
            isAuthenticated: false, // Reemplaza esto con tu lógica de autenticación
            hovering: false,
            loading: false,
            darkMode: false,
            features: [
                {
                    icon: 'mdi-chart-bar',
                    title: 'Visualizaciones profesionales',
                    subtitle: 'Gráficos interactivos y personalizables'
                },
                {
                    icon: 'mdi-file-excel',
                    title: 'Importación sencilla',
                    subtitle: 'Conecta tus datos Excel con un solo clic'
                },
                {
                    icon: 'mdi-view-dashboard',
                    title: 'Dashboards a medida',
                    subtitle: 'Diseña la visualización perfecta para tus necesidades'
                },
                {
                    icon: 'mdi-share-variant',
                    title: 'Comparte con tu equipo',
                    subtitle: 'Colabora y exporta informes fácilmente'
                }
            ],

            testimonials: [
                {
                    quote: 'Esta herramienta ha transformado completamente nuestra forma de analizar datos. Increíblemente intuitiva.',
                    author: 'María García',
                    position: 'Analista de Datos, TechCorp'
                },
                {
                    quote: 'Ahorramos horas de trabajo cada semana gracias a la facilidad de importación y visualización.',
                    author: 'Carlos Martínez',
                    position: 'Director Financiero, InnovaSoft'
                },
                {
                    quote: 'La mejor inversión en herramientas de análisis que hemos hecho este año.',
                    author: 'Ana Rodríguez',
                    position: 'CEO, DataVision'
                }
            ]
        }
    },
    methods: {
        toggleTheme() {
            this.darkMode = !this.darkMode;
            // Aquí implementarías la lógica para cambiar el tema
        },
        simulateLoading() {
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
            }, 2000);
        }
    }
}
</script>

<style scoped>
/* Estilos base y utilidades */
.position-relative {
    position: relative;
}

.transition-smooth {
    transition: all 0.3s ease;
}

.hover-scale {
    transform: scale(1.01);
}

/* Efectos de gradiente */
.gradient-text {
    background: linear-gradient(45deg, var(--v-theme-primary), var(--v-theme-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.gradient-bar {
    background: linear-gradient(90deg, var(--v-theme-primary), var(--v-theme-secondary));
}

.bg-surface-variant-subtle {
    background-color: rgb(var(--v-theme-surface-variant), 0.3);
}

/* Animaciones y efectos visuales */
.pulse-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--v-theme-primary);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 1);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.7);
    }
    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0);
    }
    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
    }
}

.animate-pulse {
    animation: icon-pulse 2s infinite;
}

@keyframes icon-pulse {
    0% {
        opacity: 0.8;
        transform: scale(0.95);
    }
    50% {
        opacity: 1;
        transform: scale(1.05);
    }
    100% {
        opacity: 0.8;
        transform: scale(0.95);
    }
}

.pulse-btn {
    position: relative;
    overflow: hidden;
}

.pulse-btn::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: inherit;
    transform: scale(0);
    opacity: 0;
    transition: 0.5s;
}

.pulse-btn:hover::after {
    transform: scale(2);
    opacity: 0;
    animation: pulse-btn 1s;
}

@keyframes pulse-btn {
    0% {
        transform: scale(0);
        opacity: 0.5;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

/* Estilos de características */
.feature-card {
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(var(--v-theme-primary), 0.1);
}

.feature-item {
    padding: 12px 8px;
    transition: all 0.3s ease;
}

.feature-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.feature-icon {
    transition: all 0.3s ease;
}

.feature-item:hover .feature-icon {
    transform: scale(1.1);
}

/* Estilos del panel derecho */
.bg-primary-lighten-1 {
    background-color: rgba(var(--v-theme-primary), 0.15);
}

.bg-animation {
    background-color: rgba(var(--v-theme-primary), 0.08);
    position: relative;
    overflow: hidden;
}

.dashboard-preview {
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
}

.dashboard-preview:hover {
    transform: translateY(-5px);
}

.preview-shadow {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.dashboard-preview:hover .preview-shadow {
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

/* Formas flotantes decorativas */
.floating-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.6;
    z-index: 1;
}

.shape1 {
    width: 100px;
    height: 100px;
    background-color: rgba(var(--v-theme-primary), 0.2);
    top: 20%;
    left: 20%;
    animation: float 8s infinite ease-in-out;
}

.shape2 {
    width: 60px;
    height: 60px;
    background-color: rgba(var(--v-theme-secondary), 0.2);
    bottom: 30%;
    right: 25%;
    animation: float 6s infinite ease-in-out 1s;
}

.shape3 {
    width: 40px;
    height: 40px;
    background-color: rgba(var(--v-theme-info), 0.2);
    top: 60%;
    left: 30%;
    animation: float 10s infinite ease-in-out 2s;
}

@keyframes float {
    0% {
        transform: translateY(0) rotate(0deg);
    }
    50% {
        transform: translateY(-20px) rotate(10deg);
    }
    100% {
        transform: translateY(0) rotate(0deg);
    }
}

/* Animaciones de gráficos miniatura */
.chart-mini {
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
}

.chart-mini:hover {
    transform: translateY(-3px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.chart-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.chart-animation.bars::before {
    content: "";
    position: absolute;
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
    background: repeating-linear-gradient(
        to right,
        rgba(var(--v-theme-primary), 0.6) 0px,
        rgba(var(--v-theme-primary), 0.6) 5px,
        transparent 5px,
        transparent 10px
    );
    animation: bar-animation 3s infinite ease-in-out;
}

.chart-animation.line::before {
    content: "";
    position: absolute;
    width: 80%;
    height: 1px;
    top: 50%;
    left: 10%;
    background-color: rgba(var(--v-theme-secondary), 0.6);
    animation: line-animation 4s infinite ease-in-out;
}

.chart-animation.pie::before {
    content: "";
    position: absolute;
    width: 40px;
    height: 40px;
    top: calc(50% - 20px);
    left: calc(50% - 20px);
    border-radius: 50%;
    border: 3px solid rgba(var(--v-theme-info), 0.6);
    border-top-color: rgba(var(--v-theme-primary), 0.6);
    animation: pie-animation 2s infinite linear;
}

@keyframes bar-animation {
    0%, 100% {
        height: 30%;
        top: 35%;
    }
    50% {
        height: 60%;
        top: 20%;
    }
}

@keyframes line-animation {
    0% {
        transform: translateY(10px) scaleX(0.8);
    }
    50% {
        transform: translateY(-10px) scaleX(1);
    }
    100% {
        transform: translateY(10px) scaleX(0.8);
    }
}

@keyframes pie-animation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* Estilos del footer */
.footer-btn {
    transition: all 0.3s ease;
    opacity: 0.8;
}

.footer-btn:hover {
    opacity: 1;
    transform: translateY(-2px);
}
</style>
