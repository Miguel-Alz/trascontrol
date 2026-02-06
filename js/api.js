/**
 * =====================================================
 * API - Comunicación con Backend
 * Sistema de Registro de Conductores
 * =====================================================
 * 
 * Este archivo consume los endpoints reales del backend.
 * Asegúrate de que el servidor esté corriendo: node backend/server.js
 */

// =====================================================
// CONFIGURACIÓN DE LA API
// =====================================================

// URL base del backend - cambiar según tu configuración
const API_BASE_URL = 'http://localhost:3000/api';

// =====================================================
// FUNCIÓN HELPER PARA PETICIONES HTTP
// =====================================================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Configuración por defecto
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Agregar token de autenticación si existe
    const token = Storage.get('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        // Si es error de conexión
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('No se puede conectar al servidor. Asegúrate de que el backend esté corriendo.');
        }
        throw error;
    }
}

// =====================================================
// API DE AUTENTICACIÓN
// =====================================================

const AuthAPI = {
    /**
     * Inicia sesión con credenciales
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async login(username, password) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success) {
            // Guardar token y datos de usuario
            Storage.set('auth_token', response.token);
            Storage.set('user_data', response.user);
        }

        return response;
    },

    /**
     * Cierra la sesión actual
     */
    logout() {
        Storage.remove('auth_token');
        Storage.remove('user_data');
    },

    /**
     * Verifica si hay una sesión activa
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = Storage.get('auth_token');
        if (!token) return false;

        try {
            // Decodificar JWT para verificar expiración
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    /**
     * Obtiene los datos del usuario actual
     * @returns {Object|null}
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        return Storage.get('user_data');
    },

    /**
     * Verifica el token con el servidor
     * @returns {Promise<Object>}
     */
    async verifyToken() {
        return await apiRequest('/auth/verify');
    }
};

// =====================================================
// API DE FORMULARIOS
// =====================================================

const FormularioAPI = {
    /**
     * Guarda un nuevo registro
     * @param {Object} data - Datos del formulario
     * @returns {Promise<Object>}
     */
    async create(data) {
        return await apiRequest('/formularios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Obtiene todos los registros con filtros opcionales
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Object>}
     */
    async getAll(filters = {}) {
        // Construir query string con los filtros
        const params = new URLSearchParams();
        
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
        if (filters.empresa) params.append('empresa', filters.empresa);
        if (filters.conductor) params.append('conductor', filters.conductor);
        if (filters.vehiculo) params.append('vehiculo', filters.vehiculo);
        if (filters.novedad) params.append('novedad', filters.novedad);

        const queryString = params.toString();
        const endpoint = queryString ? `/formularios?${queryString}` : '/formularios';
        
        return await apiRequest(endpoint);
    },

    /**
     * Obtiene un registro por ID
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    async getById(id) {
        return await apiRequest(`/formularios/${id}`);
    },

    /**
     * Actualiza un registro
     * @param {number} id 
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        return await apiRequest(`/formularios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Elimina un registro
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    async delete(id) {
        return await apiRequest(`/formularios/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Obtiene estadísticas de los registros
     * @returns {Promise<Object>}
     */
    async getStats() {
        return await apiRequest('/stats');
    },

    /**
     * Obtiene lista de conductores
     * @param {string} empresa - Filtrar por empresa (opcional)
     * @returns {Promise<Object>}
     */
    async getConductores(empresa = '') {
        const params = new URLSearchParams();
        if (empresa) params.append('empresa', empresa);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/conductores?${queryString}` : '/conductores';
        
        return await apiRequest(endpoint);
    },

    /**
     * Crea un nuevo conductor
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    async createConductor(data) {
        return await apiRequest('/conductores', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Actualiza un conductor
     * @param {number} id 
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    async updateConductor(id, data) {
        return await apiRequest(`/conductores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Elimina un conductor
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    async deleteConductor(id) {
        return await apiRequest(`/conductores/${id}`, {
            method: 'DELETE'
        });
    }
};

// =====================================================
// API DE EMPRESAS
// =====================================================

const EmpresasAPI = {
    /**
     * Obtiene todas las empresas
     * @returns {Promise<Object>}
     */
    async getAll() {
        return await apiRequest('/empresas');
    },

    /**
     * Crea una nueva empresa
     * @param {Object} data - Datos de la empresa
     * @returns {Promise<Object>}
     */
    async create(data) {
        return await apiRequest('/empresas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Actualiza una empresa
     * @param {number} id 
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        return await apiRequest(`/empresas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Elimina una empresa
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    async delete(id) {
        return await apiRequest(`/empresas/${id}`, {
            method: 'DELETE'
        });
    }
};

// =====================================================
// EXPORTACIÓN DE DATOS
// =====================================================

const ExportAPI = {
    /**
     * Exporta datos a formato CSV
     * @param {Array} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    toCSV(data, filename = 'reporte') {
        if (!data || data.length === 0) {
            throw new Error('No hay datos para exportar');
        }

        const headers = ['Fecha', 'Empresa', 'Prefijo', 'Vehículo', 'Tabla', 'Conductor', 'Hora Inicio', 'Hora Fin', 'Servicio', 'Novedad'];
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = [
                row.fecha,
                `"${row.empresa}"`,
                row.prefijo,
                row.vehiculo,
                row.tabla,
                `"${row.conductor}"`,
                row.hora_inicio,
                row.hora_fin,
                `"${row.servicio}"`,
                `"${(row.novedad || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    },

    /**
     * Exporta datos a formato Excel XLSX
     * @param {Array} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    toExcel(data, filename = 'reporte') {
        if (!data || data.length === 0) {
            throw new Error('No hay datos para exportar');
        }

        // Usar SheetJS (disponible desde CDN si no está cargado)
        if (typeof XLSX !== 'undefined') {
            // Si XLSX está disponible, usar la librería
            const workbook = XLSX.utils.book_new();
            const worksheet_data = [
                ['Fecha', 'Empresa', 'Prefijo', 'Vehículo', 'Tabla', 'Conductor', 'Hora Inicio', 'Hora Fin', 'Servicio', 'Novedad']
            ];

            data.forEach(row => {
                worksheet_data.push([
                    row.fecha || '',
                    row.empresa || '',
                    row.prefijo || '',
                    row.vehiculo || '',
                    row.tabla || '',
                    row.conductor || '',
                    row.hora_inicio || '',
                    row.hora_fin || '',
                    row.servicio || '',
                    row.novedad || ''
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
            worksheet['!cols'] = [
                {wch: 12}, {wch: 20}, {wch: 10}, {wch: 15}, {wch: 10},
                {wch: 20}, {wch: 12}, {wch: 12}, {wch: 25}, {wch: 25}
            ];
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } else {
            // Fallback: Crear formato XLSX básico (ZIP con XML)
            this.toExcelFallback(data, filename);
        }
    },

    /**
     * Fallback para exportación Excel sin librería externa
     */
    toExcelFallback(data, filename) {
        // Crear contenido XLSX XML compatible
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        xml += 'xmlns:html="http://www.w3.org/TR/REC-html40">\n';
        xml += '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n';
        xml += `<Title>Registros de Conductores - ${new Date().toLocaleDateString()}</Title>\n`;
        xml += '</DocumentProperties>\n';
        xml += '<Styles>\n';
        xml += '<Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style>\n';
        xml += '<Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF"/></Style>\n';
        xml += '</Styles>\n';
        xml += '<Worksheet ss:Name="Registros">\n';
        xml += '<Table>\n';

        // Headers
        xml += '<Row ss:StyleID="Header">\n';
        const headers = ['Fecha', 'Empresa', 'Prefijo', 'Vehículo', 'Tabla', 'Conductor', 'Hora Inicio', 'Hora Fin', 'Servicio', 'Novedad'];
        headers.forEach(header => {
            xml += `<Cell><Data ss:Type="String">${escapeHtml(header)}</Data></Cell>\n`;
        });
        xml += '</Row>\n';

        // Data rows
        data.forEach(row => {
            xml += '<Row>\n';
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.fecha || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.empresa || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.prefijo || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.vehiculo || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.tabla || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.conductor || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.hora_inicio || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.hora_fin || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml(row.servicio || '')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeHtml((row.novedad || '').replace(/"/g, '""'))}</Data></Cell>\n`;
            xml += '</Row>\n';
        });

        xml += '</Table>\n<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\n';
        xml += '<ProtectedObjects>False</ProtectedObjects>\n';
        xml += '<ProtectedScenarios>False</ProtectedScenarios>\n';
        xml += '</WorksheetOptions>\n';
        xml += '</Worksheet>\n</Workbook>';

        this.downloadFile(xml, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    },

    /**
     * Descarga un archivo
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} mimeType - Tipo MIME
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob(['\ufeff' + content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// =====================================================
// EXPORTAR PARA USO GLOBAL
// =====================================================
// EXPORTAR PARA USO GLOBAL
// =====================================================

window.API_BASE_URL = API_BASE_URL;
window.AuthAPI = AuthAPI;
window.FormularioAPI = FormularioAPI;
window.EmpresasAPI = EmpresasAPI;
