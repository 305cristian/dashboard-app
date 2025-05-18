<template>
    <v-app>

        <!-- Barra de navegación mejorada con gradiente y animaciones -->
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
                <v-btn class="mx-1" color="secondary" variant="elevated" :href="route('dash.create') "
                       prepend-icon="mdi-account-plus">
                    Crear Dashboard
                </v-btn>
            </template>

            <v-btn class="ms-2" icon="mdi-theme-light-dark" @click="toggleTheme"></v-btn>
        </v-app-bar>

        <v-container fluid class="fill-height">
            <v-row align="center" justify="center">
                <v-col cols="12">
                    <div class="upload-excel-container">
                        <v-card class="rounded-xl upload-card" elevation="3">
                            <v-card-item class="pa-4 pb-0">
                                <template v-slot:prepend>
                                    <v-avatar
                                        color="primary"
                                        variant="tonal"
                                        class="mr-3"
                                    >
                                        <v-icon size="large">mdi-file-upload</v-icon>
                                    </v-avatar>
                                </template>
                                <v-card-title class="text-h5 font-weight-bold">
                                    Upload Excel Data
                                </v-card-title>
                                <v-card-subtitle class="pt-2">
                                    Transform your Excel data into interactive dashboards in minutes
                                </v-card-subtitle>
                            </v-card-item>

                            <v-card-text class="pa-4 pt-2">
                                <!-- File format tips -->
                                <v-alert
                                    color="info"
                                    variant="tonal"
                                    icon="mdi-information-outline"
                                    class="mb-5 file-tip-alert"
                                    border="start"
                                    density="compact"
                                >
                                    <div class="d-flex flex-wrap gap-4 align-center">
                                        <div>
                                            <div class="text-subtitle-2 mb-1">Supported formats:</div>
                                            <div class="d-flex align-center">
                                                <v-chip size="small" color="success" variant="tonal" class="me-1">xlsx
                                                </v-chip>
                                                <v-chip size="small" color="success" variant="tonal" class="me-1">xls
                                                </v-chip>
                                            </div>
                                        </div>
                                        <v-divider vertical></v-divider>
                                        <div>
                                            <div class="text-subtitle-2 mb-1">Max file size:</div>
                                            <v-chip size="small" color="warning" variant="tonal">20MB</v-chip>
                                        </div>
                                        <v-divider vertical></v-divider>

                                    </div>
                                </v-alert>

                                <v-slide-y-transition>
                                    <v-alert
                                        v-if="fileErrorMessage"
                                        type="error"
                                        variant="tonal"
                                        class="mb-4"
                                        icon="mdi-alert-circle"
                                        closable
                                        border="start"
                                    >
                                        {{ fileErrorMessage }}
                                    </v-alert>
                                </v-slide-y-transition>

                                <v-form ref="form" v-model="valid" lazy-validation>

                                    <div
                                        class="upload-zone rounded-lg d-flex flex-column align-center justify-center pa-8 mb-5"
                                        :class="{
                                                'upload-zone-drag': isDragging,
                                                'upload-zone-has-file': selectedFile,
                                                'upload-zone-error': fileErrorMessage
                                            }"
                                        @dragover.prevent="isDragging = true"
                                        @dragleave.prevent="isDragging = false"
                                        @drop.prevent="handleFileDrop"
                                        @click="$refs.fileInput.click()"
                                    >
                                        <input
                                            ref="fileInput"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            style="display: none"
                                            @change="handleFileInput"
                                        />

                                        <v-fade-transition>
                                            <div v-if="!selectedFile" class="text-center">
                                                <v-icon
                                                    size="72"
                                                    :color="isDragging ? 'primary' : 'grey-lighten-1'"
                                                    class="mb-3 upload-icon"
                                                >
                                                    mdi-cloud-upload-outline
                                                </v-icon>
                                                <div class="text-h6 mb-2">Drag & Drop Excel File Here</div>
                                                <div class="text-body-2 text-grey mb-3">
                                                    or click to browse your files
                                                </div>
                                                <v-btn
                                                    color="primary"
                                                    variant="tonal"
                                                    prepend-icon="mdi-file-search-outline"
                                                >
                                                    Browse Files
                                                </v-btn>
                                            </div>
                                        </v-fade-transition>

                                        <v-fade-transition>
                                            <div v-if="selectedFile" class="text-center file-preview">
                                                <v-avatar
                                                    size="72"
                                                    color="success"
                                                    class="mb-3 file-icon-avatar"
                                                >
                                                    <v-icon size="40" color="white">mdi-file-excel</v-icon>
                                                </v-avatar>
                                                <div class="text-h5 mb-1">{{ selectedFile.name }}</div>
                                                <div class="text-caption text-grey mb-3">
                                                    {{ formatFileSize(selectedFile.size) }}
                                                </div>
                                                <div class="d-flex justify-center">
                                                    <v-btn
                                                        color="primary"
                                                        variant="text"
                                                        prepend-icon="mdi-file-replace-outline"
                                                        class="me-2"
                                                        @click.stop="$refs.fileInput.click()"
                                                    >
                                                        Change file
                                                    </v-btn>
                                                    <v-btn
                                                        color="error"
                                                        variant="text"
                                                        prepend-icon="mdi-close"
                                                        @click.stop="removeFile"
                                                    >
                                                        Remove
                                                    </v-btn>
                                                </div>
                                            </div>
                                        </v-fade-transition>
                                    </div>

                                    <!-- Validation check list -->
                                    <v-expand-transition>
                                        <div v-if="selectedFile">
                                            <div class="d-flex align-center mb-2">
                                                <v-icon color="success" class="me-2">mdi-check-circle</v-icon>
                                                <span class="text-subtitle-2">File validation checks:</span>
                                            </div>
                                            <v-list density="compact" class="validation-list mb-4 rounded-lg">
                                                <v-list-item>
                                                    <template v-slot:prepend>
                                                        <v-icon :color="isValidFormat ? 'success' : 'error'">
                                                            {{
                                                                isValidFormat ? 'mdi-check-circle' : 'mdi-close-circle'
                                                            }}
                                                        </v-icon>
                                                    </template>
                                                    <v-list-item-title :class="{'text-grey': !isValidFormat}">
                                                        Valid file format
                                                    </v-list-item-title>
                                                </v-list-item>

                                                <v-list-item>
                                                    <template v-slot:prepend>
                                                        <v-icon :color="isValidSize ? 'success' : 'error'">
                                                            {{ isValidSize ? 'mdi-check-circle' : 'mdi-close-circle' }}
                                                        </v-icon>
                                                    </template>
                                                    <v-list-item-title :class="{'text-grey': !isValidSize}">
                                                        File size under 20MB
                                                    </v-list-item-title>
                                                </v-list-item>

                                                <v-list-item>
                                                    <template v-slot:prepend>
                                                        <v-icon :color="hasValidContent ? 'success' : 'warning'">
                                                            {{
                                                                hasValidContent ? 'mdi-check-circle' : 'mdi-alert-circle'
                                                            }}
                                                        </v-icon>
                                                    </template>
                                                    <v-list-item-title :class="{'text-grey': !hasValidContent}">
                                                        Content structure validated
                                                    </v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </div>
                                    </v-expand-transition>
                                </v-form>
                            </v-card-text>

                            <v-divider></v-divider>

                            <v-card-actions class="pa-4">
                                <v-tooltip location="top">
                                    <template v-slot:activator="{ props }">
                                        <div v-bind="props">
                                            <v-btn
                                                color="info"
                                                variant="text"
                                                icon="mdi-help-circle-outline"
                                                class="me-2"
                                                @click="showHelp = true"
                                            ></v-btn>
                                        </div>
                                    </template>
                                    <span>Get help</span>
                                </v-tooltip>
                                <v-spacer></v-spacer>
                                <v-btn
                                    color="secondary"
                                    variant="outlined"
                                    class="me-2"
                                    :to="{ name: 'welcome' }"
                                >
                                    Cancel
                                </v-btn>
                                <v-btn
                                    color="primary"
                                    :disabled="!isFormValid"
                                    :loading="isUploading"
                                    @click="uploadFile"
                                    class="upload-button"
                                    prepend-icon="mdi-cloud-upload"
                                >
                                    Upload File
                                    <template v-slot:loader>
                                        <v-progress-circular indeterminate color="white"></v-progress-circular>
                                    </template>
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </v-app>
</template>

<script src="../../../../assets/js/uploadFile.js"></script>

<style src="../../../../assets/css/uploadFile.css"></style>


