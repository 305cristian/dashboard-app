<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>My Dashboards</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon :href="route('home')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
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

    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item :href="route('home')">
          <template v-slot:prepend>
            <v-icon>mdi-home</v-icon>
          </template>
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>

        <v-list-item :href="route('dash.createDashboard')">
          <template v-slot:prepend>
            <v-icon>mdi-view-dashboard-outline</v-icon>
          </template>
          <v-list-item-title>Create Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item :href="route('dash.upload')">
          <template v-slot:prepend>
            <v-icon>mdi-file-upload-outline</v-icon>
          </template>
          <v-list-item-title>Upload Excel</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'view-dashboards' }" active>
          <template v-slot:prepend>
            <v-icon>mdi-view-list</v-icon>
          </template>
          <v-list-item-title>View Dashboards</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center mb-4">
              <h1 class="text-h4 font-weight-bold">My Dashboards</h1>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                :href="route('dash.createDashboard')"
              >
                Create Dashboard
              </v-btn>
            </div>

            <v-card>
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="3">
                    <v-text-field
                      v-model="search"
                      label="Search Dashboards"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      hide-details
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-select
                      v-model="filterCategory"
                      :items="filterCategories"
                      label="Category"
                      variant="outlined"
                      hide-details
                      density="compact"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-select
                      v-model="sortBy"
                      :items="sortOptions"
                      label="Sort By"
                      variant="outlined"
                      hide-details
                      density="compact"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-btn-toggle v-model="viewType" density="compact" mandatory>
                      <v-btn value="grid">
                        <v-icon>mdi-view-grid</v-icon>
                      </v-btn>
                      <v-btn value="list">
                        <v-icon>mdi-view-list</v-icon>
                      </v-btn>
                    </v-btn-toggle>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="viewType === 'grid'" class="mt-4">
          <v-col
            v-for="dashboard in filteredDashboards"
            :key="dashboard.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              height="280"
              class="d-flex flex-column"
              @click="openDashboard(dashboard)"
            >
              <v-img
                :src="dashboard.jpg"
                height="150"
                cover
                class="flex-grow-0"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-primary-lighten-4">
                    <v-icon
                      size="64"
                      color="primary"
                      icon="mdi-view-dashboard"
                    ></v-icon>
                  </div>
                </template>
                <div class="d-flex fill-height align-end">
                  <v-chip
                    size="small"
                    color="primary"
                    class="ma-2"
                  >
                      {{dashboard.category}}
                  </v-chip>
                </div>
              </v-img>

              <v-card-title class="text-subtitle-1 font-weight-bold text-truncate">
                {{ dashboard.name }}
              </v-card-title>

              <v-card-text class="py-1">
                <div class="text-caption text-grey">
                  Created {{ formatDate(dashboard.created_at) }}
                </div>
                <div class="text-caption text-grey mb-2">
                  Last updated {{ formatDate(dashboard.updated_at) }}
                </div>
                <div class="text-caption d-flex align-center">
                  <v-icon size="small" color="primary" class="me-1">mdi-chart-box</v-icon>
                  {{ dashboard.count_widgets }} widgets
                </div>
              </v-card-text>

              <v-spacer></v-spacer>

              <v-card-actions>
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  @click.stop="openDashboard(dashboard)"
                >
                  View
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-else class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-data-table
                :headers="tableHeaders"
                :items="filteredDashboards"
                :search="search"
                density="comfortable"
              >
                <template v-slot:item.name="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar
                      :color="getCategoryColor(item.category)"
                      size="32"
                      class="me-3"
                    >
                      <v-icon color="white" size="small">
                        mdi-view-dashboard
                      </v-icon>
                    </v-avatar>
                    <div>{{ item.name }}</div>
                  </div>
                </template>

                <template v-slot:item.category="{ item }">
                  <v-chip
                    :color="getCategoryColor(item.category)"
                    size="small"
                    label
                    class="text-white"
                  >
                    {{ item.category }}
                  </v-chip>
                </template>

                <template v-slot:item.created_at="{ item }">
                  {{ formatDate(item.created_at) }}
                </template>

                <template v-slot:item.updated_at="{ item }">
                  {{ formatDate(item.updated_at) }}
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="primary"
                    @click="openDashboard(item)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDeleteDashboard(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty state -->
        <v-row v-if="filteredDashboards.length === 0" class="mt-4">
          <v-col cols="12" class="text-center">
            <v-sheet class="pa-12 rounded">
              <v-icon size="64" color="grey" class="mb-4">mdi-view-dashboard-variant</v-icon>
              <h3 class="text-h5 mb-2">No dashboards found</h3>
              <p class="text-body-1 mb-6">
                {{
                  search || filterCategory
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first dashboard'
                }}
              </p>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                :to="{ name: 'create-dashboard' }"
              >
                Create Dashboard
              </v-btn>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Delete Dashboard</v-card-title>
        <v-card-text>
          Are you sure you want to delete the dashboard "{{ selectedDashboard?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteDashboard">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script src="../../../../assets/js/home.js"></script>

<style scoped>
.bg-primary-lighten-4 {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
