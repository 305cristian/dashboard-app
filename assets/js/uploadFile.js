import axios from 'axios';

export default {

    name: 'UploadExcelData',
    data() {
        return {
            // UI State
            isDragging: false,
            showHelp: false,

            // Form state
            valid: true,
            nameRules: [
                v => !!v || 'Name is required',
                v => (v && v.length <= 50) || 'Name must be less than 50 characters',
            ],
            datasetDescription: '',
            dataCategories: [
                'Sales',
                'Marketing',
                'Finance',
                'HR',
                'Operations',
                'Customer Data',
                'Other'
            ],

            // File handling
            selectedFile: null,
            fileErrorMessage: '',
            isUploading: false,
            isValidFormat: true,
            isValidSize: true,
            hasValidContent: true,
        }
    },
    computed: {
        isFormValid() {
            return this.valid && this.selectedFile && this.isValidFormat && this.isValidSize;
        }
    },
    methods: {
        handleFileDrop(event) {
            this.isDragging = false;
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.validateAndSetFile(files[0]);
            }
        },
        handleFileInput(event) {

            const files = event.target.files;
            if (files.length > 0) {
                this.validateAndSetFile(files[0]);
            }
        },
        validateAndSetFile(file) {
            // Restablecer estado
            this.fileErrorMessage = '';
            this.isValidFormat = true;
            this.isValidSize = true;
            this.hasValidContent = true;

            // Verificar extensión del archivo
            const validExtensions = ['.xlsx', '.xls'];
            const fileName = file.name.toLowerCase();
            const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidExtension) {
                this.fileErrorMessage = 'Please upload a valid Excel or CSV file (.xlsx, .xls)';
                this.isValidFormat = false;
                return;
            }

            // Verificar tamaño del archivo (máx 20MB)
            const maxSize = 20 * 1024 * 1024; // 20MB en bytes
            if (file.size > maxSize) {
                this.fileErrorMessage = 'File size exceeds 20MB limit';
                this.isValidSize = false;
                return;
            }

            this.hasValidContent = true;

            this.selectedFile = file;

        },
        removeFile() {
            this.selectedFile = null;
            this.fileErrorMessage = '';
            this.isValidFormat = true;
            this.isValidSize = true;
            this.hasValidContent = true;

            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        async uploadFile() {
            if (!this.isFormValid) return;

            this.isUploading = true;

            const formData = new FormData();
            formData.append('excel_file', this.selectedFile);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            try {
                const response = await axios.post('/dashboard/uploadFile', formData, config);

                if (response.data.status ==='success') {

                    this.isUploading = false;

                    Swal.fire({
                        title: '¡Éxito!',
                        text: response.data.msg,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then((result) => {
                        if (result.isConfirmed) {
                             window.location.href = '/dashboard/create'; // Cambia esto por tu URL
                        }
                    });
                }else{
                    Swal.fire({
                        title: '¡Atención!',
                        text: response.data.msg,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    })
                }
            }catch (error) {

                Swal.fire({
                    icon: 'error',
                    title: '¡Error!',
                    text: error.message,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#3085d6'
                });
            }


        },

    }
}
