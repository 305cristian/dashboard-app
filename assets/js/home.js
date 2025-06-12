import axios from 'axios';

export default {

    props: {
        listaWidgets: Array
    },

    name: 'ViewDashboards',
    data() {
        return {
            drawer: false,
            search: '',
            filterCategory: '',
            sortBy: 'updated',
            viewType: 'grid',
            deleteDialog: false,
            selectedDashboard: null,
            tableHeaders: [
                {title: 'Name', key: 'name', sortable: true},
                {title: 'Category', key: 'category', sortable: true},
                {title: 'Created', key: 'created_at', sortable: true},
                {title: 'Updated', key: 'updated_at', sortable: true},
                {title: 'Widgets', key: 'count_widgets', sortable: true},
                {title: 'Actions', key: 'actions', sortable: false}
            ],
            filterCategories: [
                '',
                'Sales',
                'Marketing',
                'Finance',
                'Operations',
                'HR'
            ],
            sortOptions: [
                {title: 'Last Updated', value: 'updated'},
                {title: 'Recently Created', value: 'created'},
                {title: 'Name (A-Z)', value: 'name-asc'},
                {title: 'Name (Z-A)', value: 'name-desc'}
            ],
            // Sample data - in real application this would come from your API

            dashboards: this.listaWidgets,

        }
    },
    computed: {
        filteredDashboards() {
            let result = [...this.dashboards];

            // Apply category filter
            if (this.filterCategory) {
                result = result.filter(d => d.category === this.filterCategory);
            }

            // Apply search filter
            if (this.search) {
                const searchLower = this.search.toLowerCase();
                result = result.filter(d =>
                    d.name.toLowerCase().includes(searchLower) ||
                    d.category.toLowerCase().includes(searchLower)
                );
            }

            // Apply sorting
            switch (this.sortBy) {
                case 'updated':
                    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    break;
                case 'created':
                    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'name-asc':
                    result.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    result.sort((a, b) => b.name.localeCompare(a.name));
                    break;
            }

            return result;
        }
    },
    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('default', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        },
        getCategoryColor(category) {
            const colors = {
                'Sales': 'primary',
                'Marketing': 'green',
                'Finance': 'indigo',
                'HR': 'orange',
                'Operations': 'teal'
            };
            return colors[category] || 'grey';
        },
        openDashboard(dashboard) {
            window.location.href = '/dashboard/viewPreview/' + dashboard.id;
        },
        editDashboard(dashboard) {
            // In a real application, navigate to the dashboard editor
            console.log('Editing dashboard:', dashboard.id);
            this.$router.push({
                name: 'create-dashboard',
                params: {id: dashboard.id}
            });
        },
        confirmDeleteDashboard(dashboard) {
            this.selectedDashboard = dashboard;
            this.deleteDialog = true;
        },
        deleteDashboard() {
            // In a real application, call your API to delete the dashboard
            console.log('Deleting dashboard:', this.selectedDashboard.id);
            axios.delete("/dashboard/delete/" + this.selectedDashboard.id).then(response => {
                if (response.data.success) {
                    this.dashboards = this.dashboards.filter(d => d.id !== this.selectedDashboard.id);
                    this.deleteDialog = false;
                    this.selectedDashboard = null;
                }
            });

        }
    }
}
