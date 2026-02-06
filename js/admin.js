/**
 * =====================================================
 * ADMIN.JS - Lógica del Panel de Administración
 * Sistema de Registro de Conductores
 * =====================================================
 */

// =====================================================
// CONTROLADOR DE AUTENTICACIÓN (LOGIN)
// =====================================================

class LoginController {
    constructor() {
        this.loginSection = document.getElementById('loginSection');
        this.dashboardSection = document.getElementById('dashboardSection');
        this.loginForm = document.getElementById('loginForm');
        this.btnLogin = document.getElementById('btnLogin');
        this.togglePassword = document.getElementById('togglePassword');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');

        this.init();
    }

    init() {
        // Verificar si ya está autenticado
        if (AuthAPI.isAuthenticated()) {
            this.showDashboard();
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulario de login
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Toggle de contraseña
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());

        // Enter en campos
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.passwordInput.focus();
        });
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        
        // Cambiar icono
        const icon = this.togglePassword.querySelector('svg');
        if (type === 'text') {
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        if (!username || !password) {
            toast.error('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }

        this.setLoadingState(true);

        try {
            const response = await AuthAPI.login(username, password);
            
            if (response.success) {
                toast.success('¡Bienvenido!', `Hola, ${response.user.nombre}`);
                
                // Pequeño delay para mostrar el mensaje
                setTimeout(() => {
                    this.showDashboard();
                }, 500);
            }
        } catch (error) {
            toast.error('Error de acceso', error.message || 'Credenciales incorrectas');
            this.passwordInput.value = '';
            this.passwordInput.focus();
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const btnText = this.btnLogin.querySelector('.btn-text');
        const btnLoading = this.btnLogin.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            this.btnLogin.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            this.btnLogin.disabled = false;
        }
    }

    showDashboard() {
        this.loginSection.classList.add('hidden');
        this.dashboardSection.classList.remove('hidden');
        
        // Inicializar el dashboard
        window.dashboardController = new DashboardController();
    }

    showLogin() {
        this.dashboardSection.classList.add('hidden');
        this.loginSection.classList.remove('hidden');
        this.loginForm.reset();
    }
}

// =====================================================
// CONTROLADOR DEL DASHBOARD
// =====================================================

class DashboardController {
    constructor() {
        // Elementos del DOM
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.menuToggle = document.getElementById('menuToggle');
        this.btnLogout = document.getElementById('btnLogout');
        this.btnRefresh = document.getElementById('btnRefresh');
        this.pageTitle = document.getElementById('pageTitle');
        
        // Estadísticas
        this.statElements = {
            totalRegistros: document.getElementById('totalRegistros'),
            totalConductores: document.getElementById('totalConductores'),
            totalNovedades: document.getElementById('totalNovedades'),
            totalVehiculos: document.getElementById('totalVehiculos')
        };

        // Tabla
        this.tableBody = document.getElementById('tableBody');
        this.tableEmpty = document.getElementById('tableEmpty');
        this.paginationControls = document.getElementById('paginationControls');
        this.showingStart = document.getElementById('showingStart');
        this.showingEnd = document.getElementById('showingEnd');
        this.totalRecords = document.getElementById('totalRecords');

        // Filtros
        this.filtersPanel = document.getElementById('filtersPanel');
        this.btnToggleFilters = document.getElementById('btnToggleFilters');
        this.btnApplyFilters = document.getElementById('btnApplyFilters');
        this.btnClearFilters = document.getElementById('btnClearFilters');

        // Exportación
        this.btnExport = document.getElementById('btnExport');
        this.exportModal = document.getElementById('exportModal');
        this.closeExportModal = document.getElementById('closeExportModal');
        this.cancelExport = document.getElementById('cancelExport');
        this.confirmExport = document.getElementById('confirmExport');
        this.exportOptions = document.querySelectorAll('.export-option');

        // Estado
        this.currentPage = 1;
        this.filters = {};
        this.allData = [];
        this.selectedExportFormat = 'xlsx';
        
        // Mapa para almacenar datos de registros por ID
        this.recordsMap = new Map();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadStats();
        this.loadData();
        
        // Inicializar controladores adicionales
        window.configController = new ConfigController();
        window.editRegistroController = new EditRegistroController();
    }

    setupEventListeners() {
        // Sidebar toggle (móvil)
        if (this.menuToggle) this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        if (this.sidebarOverlay) this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // Logout
        if (this.btnLogout) this.btnLogout.addEventListener('click', () => this.handleLogout());

        // Refresh
        if (this.btnRefresh) this.btnRefresh.addEventListener('click', () => this.refreshData());

        // Filtros
        if (this.btnToggleFilters) this.btnToggleFilters.addEventListener('click', () => this.toggleFilters());
        if (this.btnApplyFilters) this.btnApplyFilters.addEventListener('click', () => this.applyFilters());
        if (this.btnClearFilters) this.btnClearFilters.addEventListener('click', () => this.clearFilters());

        // Exportación
        if (this.btnExport) this.btnExport.addEventListener('click', () => this.openExportModal());
        if (this.closeExportModal) this.closeExportModal.addEventListener('click', () => this.closeExportModalHandler());
        if (this.cancelExport) this.cancelExport.addEventListener('click', () => this.closeExportModalHandler());
        if (this.confirmExport) this.confirmExport.addEventListener('click', () => this.handleExport());

        // Opciones de exportación
        if (this.exportOptions && this.exportOptions.length > 0) {
            this.exportOptions.forEach(option => {
                option.addEventListener('click', () => this.selectExportFormat(option));
            });
        }

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeExportModalHandler();
        });

        // Navegación del sidebar
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(item);
            });
        });

        // Ordenamiento de tabla
        document.querySelectorAll('.data-table th.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th));
        });
    }

    // =====================================================
    // USUARIO Y SESIÓN
    // =====================================================

    loadUserInfo() {
        const user = AuthAPI.getCurrentUser();
        if (user) {
            const userName = document.getElementById('userName');
            const userRole = document.getElementById('userRole');
            const userAvatar = document.getElementById('userAvatar');
            
            if (userName) userName.textContent = user.nombre || user.username;
            if (userRole) userRole.textContent = user.rol === 'admin' ? 'Administrador' : user.rol;
            if (userAvatar) userAvatar.textContent = (user.nombre || user.username).substring(0, 2).toUpperCase();
        }
    }

    handleLogout() {
        AuthAPI.logout();
        toast.info('Sesión cerrada', 'Hasta pronto');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    // =====================================================
    // SIDEBAR
    // =====================================================

    toggleSidebar() {
        if (this.sidebar) this.sidebar.classList.toggle('open');
        if (this.sidebarOverlay) this.sidebarOverlay.classList.toggle('active');
    }

    closeSidebar() {
        if (this.sidebar) this.sidebar.classList.remove('open');
        if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('active');
    }

    handleNavigation(item) {
        // Remover clase activa de todos
        document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Actualizar título
        const section = item.dataset.section;
        const sectionNames = {
            'dashboard': 'Dashboard',
            'registros': 'Registros de Conductores',
            'configuracion': 'Configuración'
        };
        if (this.pageTitle) this.pageTitle.textContent = sectionNames[section] || 'Dashboard';

        // Mostrar/ocultar secciones
        const dataSection = document.querySelector('.data-section');
        const configSection = document.getElementById('configSection');
        const statsGrid = document.querySelector('.stats-grid');

        if (dataSection) dataSection.classList.add('hidden');
        if (configSection) configSection.classList.add('hidden');
        if (statsGrid) statsGrid.classList.add('hidden');

        if (section === 'dashboard') {
            if (statsGrid) statsGrid.classList.remove('hidden');
            if (dataSection) dataSection.classList.remove('hidden');
        } else if (section === 'registros') {
            if (dataSection) dataSection.classList.remove('hidden');
        } else if (section === 'configuracion') {
            if (configSection) configSection.classList.remove('hidden');
            // Recargar empresas
            if (window.configController) {
                window.configController.loadEmpresas();
            }
        }

        // Cerrar sidebar en móvil
        this.closeSidebar();
    }

    // =====================================================
    // ESTADÍSTICAS
    // =====================================================

    async loadStats() {
        try {
            const response = await FormularioAPI.getStats();
            
            if (response.success) {
                const stats = response.data;
                
                // Animar los números
                if (this.statElements.totalRegistros) this.animateNumber(this.statElements.totalRegistros, stats.totalRegistros);
                if (this.statElements.totalConductores) this.animateNumber(this.statElements.totalConductores, stats.totalConductores);
                if (this.statElements.totalNovedades) this.animateNumber(this.statElements.totalNovedades, stats.totalNovedades);
                if (this.statElements.totalVehiculos) this.animateNumber(this.statElements.totalVehiculos, stats.totalVehiculos);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    animateNumber(element, target) {
        if (!element || !target) return;
        
        const duration = 1000;
        const start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + (target - start) * easeOutQuart);
            
            element.textContent = formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // =====================================================
    // TABLA DE DATOS
    // =====================================================

    async loadData() {
        try {
            const response = await FormularioAPI.getAll({
                ...this.filters,
                page: this.currentPage
            });

            if (response.success) {
                this.allData = response.data;
                this.renderTable(response.data);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('Error', 'No se pudieron cargar los registros');
        }
    }

    renderTable(data) {
        if (!data || data.length === 0) {
            this.tableBody.innerHTML = '';
            this.tableEmpty.classList.remove('hidden');
            return;
        }

        this.tableEmpty.classList.add('hidden');

        // Limpiar map y almacenar datos
        this.recordsMap.clear();
        data.forEach(row => {
            if (row.id) {
                this.recordsMap.set(row.id.toString(), row);
            }
        });

        this.tableBody.innerHTML = data.map(row => `
            <tr data-record-id="${row.id}">
                <td>${DateUtils.format(row.fecha)}</td>
                <td>
                    <span class="badge badge-primary">${escapeHtml(row.empresa)}</span>
                </td>
                <td><strong>${escapeHtml(row.prefijo)}</strong></td>
                <td>${escapeHtml(row.vehiculo)}</td>
                <td>${escapeHtml(row.conductor)}</td>
                <td>${row.hora_inicio} - ${row.hora_fin}</td>
                <td>${truncate(escapeHtml(row.servicio), 30)}</td>
                <td>
                    ${row.novedad && row.novedad.trim() 
                        ? `<span class="badge badge-warning" title="${escapeHtml(row.novedad)}">Sí</span>` 
                        : '<span class="badge badge-success">No</span>'}
                </td>
                <td>
                    <div class="action-buttons-table">
                        <button class="btn btn-xs btn-secondary btn-edit-registro" data-record-id="${row.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Agregar event listeners a los botones de editar
        this.tableBody.querySelectorAll('.btn-edit-registro').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const recordId = btn.dataset.recordId;
                const registro = this.recordsMap.get(recordId);
                if (registro && window.editRegistroController) {
                    window.editRegistroController.openModal(registro);
                }
            });
        });
    }

    renderPagination(pagination) {
        if (!this.paginationControls) return;
        
        const { total, page, limit, totalPages } = pagination;
        
        // Actualizar info
        const start = total === 0 ? 0 : (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        
        if (this.showingStart) this.showingStart.textContent = start;
        if (this.showingEnd) this.showingEnd.textContent = end;
        if (this.totalRecords) this.totalRecords.textContent = total;

        // Generar botones de paginación
        let html = '';

        // Botón anterior
        html += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
        </button>`;

        // Números de página
        const maxButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Botón siguiente
        html += `<button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </button>`;

        this.paginationControls.innerHTML = html;

        // Event listeners para paginación
        this.paginationControls.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newPage = parseInt(btn.dataset.page);
                if (newPage && newPage !== this.currentPage) {
                    this.currentPage = newPage;
                    this.loadData();
                }
            });
        });
    }

    handleSort(th) {
        const sortField = th.dataset.sort;
        // Implementar ordenamiento si es necesario
        console.log('Ordenar por:', sortField);
    }

    // =====================================================
    // FILTROS
    // =====================================================

    toggleFilters() {
        if (this.filtersPanel) {
            this.filtersPanel.classList.toggle('active');
        }
    }

    applyFilters() {
        const filterFechaInicio = document.getElementById('filterFechaInicio');
        const filterFechaFin = document.getElementById('filterFechaFin');
        const filterEmpresa = document.getElementById('filterEmpresa');
        const filterConductor = document.getElementById('filterConductor');
        const filterVehiculo = document.getElementById('filterVehiculo');
        const filterNovedad = document.getElementById('filterNovedad');
        
        this.filters = {
            fechaInicio: filterFechaInicio ? filterFechaInicio.value : '',
            fechaFin: filterFechaFin ? filterFechaFin.value : '',
            empresa: filterEmpresa ? filterEmpresa.value : '',
            conductor: filterConductor ? filterConductor.value : '',
            vehiculo: filterVehiculo ? filterVehiculo.value : '',
            novedad: filterNovedad ? filterNovedad.value : ''
        };

        // Limpiar filtros vacíos
        Object.keys(this.filters).forEach(key => {
            if (!this.filters[key]) delete this.filters[key];
        });

        this.currentPage = 1;
        this.loadData();
        
        toast.info('Filtros aplicados', `${Object.keys(this.filters).length} filtro(s) activo(s)`);
    }

    clearFilters() {
        const filterIds = ['filterFechaInicio', 'filterFechaFin', 'filterEmpresa', 'filterConductor', 'filterVehiculo', 'filterNovedad'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.filters = {};
        this.currentPage = 1;
        this.loadData();
        
        toast.info('Filtros limpiados', 'Mostrando todos los registros');
    }

    // =====================================================
    // EXPORTACIÓN
    // =====================================================

    openExportModal() {
        if (this.exportModal) {
            this.exportModal.classList.add('active');
        }
    }

    closeExportModalHandler() {
        if (this.exportModal) {
            this.exportModal.classList.remove('active');
        }
    }

    selectExportFormat(option) {
        this.exportOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedExportFormat = option.dataset.format;
    }

    async handleExport() {
        try {
            // Obtener todos los datos con los filtros actuales (sin paginación)
            const response = await FormularioAPI.getAll({
                ...this.filters,
                limit: 10000 // Obtener todos
            });

            if (!response.success || !response.data.length) {
                toast.warning('Sin datos', 'No hay registros para exportar');
                return;
            }

            const filename = `registros_conductores_${DateUtils.today()}`;

            if (this.selectedExportFormat === 'xlsx') {
                ExportAPI.toExcel(response.data, filename);
            } else {
                ExportAPI.toCSV(response.data, filename);
            }

            toast.success('Exportación exitosa', `Se descargó el archivo ${filename}`);
            this.closeExportModalHandler();
        } catch (error) {
            console.error('Error al exportar:', error);
            toast.error('Error', 'No se pudo exportar los datos');
        }
    }

    // =====================================================
    // UTILIDADES
    // =====================================================

    async refreshData() {
        const btn = this.btnRefresh;
        if (!btn) return;
        
        btn.disabled = true;
        const svg = btn.querySelector('svg');
        if (svg) svg.style.animation = 'spin 1s linear infinite';

        await Promise.all([
            this.loadStats(),
            this.loadData()
        ]);

        btn.disabled = false;
        if (svg) svg.style.animation = '';
        
        toast.success('Datos actualizados', 'La información ha sido actualizada');
    }
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar controlador de login
    window.loginController = new LoginController();
});
