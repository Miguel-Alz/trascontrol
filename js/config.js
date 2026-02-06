/**
 * =====================================================
 * CONFIG.JS - Sección de Configuración del Admin
 * Gestión de Empresas
 * =====================================================
 */

class ConfigController {
    constructor() {
        // Elementos
        this.configSection = document.getElementById('configSection');
        this.empresaForm = document.getElementById('empresaForm');
        this.empresasTableBody = document.getElementById('empresasTableBody');
        this.empresasEmpty = document.getElementById('empresasEmpty');

        // Modal de edición
        this.editEmpresaModal = document.getElementById('editEmpresaModal');
        this.closeEditEmpresaModal = document.getElementById('closeEditEmpresaModal');
        this.cancelEditEmpresa = document.getElementById('cancelEditEmpresa');
        this.confirmEditEmpresa = document.getElementById('confirmEditEmpresa');
        this.editEmpresaForm = document.getElementById('editEmpresaForm');
        this.editEmpresaId = document.getElementById('editEmpresaId');
        this.editEmpresaNombre = document.getElementById('editEmpresaNombre');
        this.editEmpresaPrefijo = document.getElementById('editEmpresaPrefijo');
        this.editEmpresaActiva = document.getElementById('editEmpresaActiva');

        this.allEmpresas = [];
        this.init();
    }

    init() {
        // Validar que los elementos existan antes de continuar
        if (this.empresaForm) {
            this.setupEventListeners();
            this.loadEmpresas();
        }
    }

    setupEventListeners() {
        // Crear empresa
        if (this.empresaForm) {
            this.empresaForm.addEventListener('submit', (e) => this.handleCreateEmpresa(e));
        }

        // Modal de edición
        if (this.closeEditEmpresaModal) {
            this.closeEditEmpresaModal.addEventListener('click', () => this.closeEditModal());
        }
        if (this.cancelEditEmpresa) {
            this.cancelEditEmpresa.addEventListener('click', () => this.closeEditModal());
        }
        if (this.confirmEditEmpresa) {
            this.confirmEditEmpresa.addEventListener('click', () => this.handleUpdateEmpresa());
        }
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeEditModal();
        });
    }

    async loadEmpresas() {
        try {
            const response = await EmpresasAPI.getAll();
            
            if (response.success) {
                this.allEmpresas = response.data;
                this.renderEmpresas();
            }
        } catch (error) {
            console.error('Error cargando empresas:', error);
            toast.error('Error', 'No se pudieron cargar las empresas');
        }
    }

    renderEmpresas() {
        if (!this.allEmpresas || this.allEmpresas.length === 0) {
            this.empresasTableBody.innerHTML = '';
            this.empresasEmpty.classList.remove('hidden');
            return;
        }

        this.empresasEmpty.classList.add('hidden');

        this.empresasTableBody.innerHTML = this.allEmpresas.map(empresa => `
            <tr>
                <td><strong>${escapeHtml(empresa.nombre)}</strong></td>
                <td><code>${escapeHtml(empresa.prefijo)}</code></td>
                <td>
                    <span class="badge ${empresa.activa ? 'badge-success' : 'badge-danger'}">
                        ${empresa.activa ? 'Activa' : 'Inactiva'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="window.configController.openEditModal(${empresa.id}, '${escapeHtml(empresa.nombre)}', '${escapeHtml(empresa.prefijo)}', ${empresa.activa})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.configController.handleDeleteEmpresa(${empresa.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async handleCreateEmpresa(e) {
        e.preventDefault();

        const nombre = document.getElementById('empresaNombre').value.trim();
        const prefijo = document.getElementById('empresaPrefijo').value.trim().toUpperCase();

        if (!nombre || !prefijo) {
            toast.error('Error', 'Nombre y prefijo son requeridos');
            return;
        }

        try {
            const response = await EmpresasAPI.create({ nombre, prefijo });
            
            if (response.success) {
                toast.success('Éxito', 'Empresa creada correctamente');
                this.empresaForm.reset();
                this.loadEmpresas();
            }
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo crear la empresa');
        }
    }

    openEditModal(id, nombre, prefijo, activa) {
        if (!this.editEmpresaModal) return;
        
        if (this.editEmpresaId) this.editEmpresaId.value = id;
        if (this.editEmpresaNombre) this.editEmpresaNombre.value = nombre;
        if (this.editEmpresaPrefijo) this.editEmpresaPrefijo.value = prefijo;
        if (this.editEmpresaActiva) this.editEmpresaActiva.checked = activa;
        this.editEmpresaModal.classList.add('active');
    }

    closeEditModal() {
        if (this.editEmpresaModal) {
            this.editEmpresaModal.classList.remove('active');
        }
    }

    async handleUpdateEmpresa() {
        const id = this.editEmpresaId ? this.editEmpresaId.value : null;
        const nombre = this.editEmpresaNombre ? this.editEmpresaNombre.value.trim() : '';
        const prefijo = this.editEmpresaPrefijo ? this.editEmpresaPrefijo.value.trim().toUpperCase() : '';
        const activa = this.editEmpresaActiva ? this.editEmpresaActiva.checked : true;

        if (!nombre || !prefijo) {
            toast.error('Error', 'Nombre y prefijo son requeridos');
            return;
        }

        try {
            const response = await EmpresasAPI.update(id, { nombre, prefijo, activa });
            
            if (response.success) {
                toast.success('Éxito', 'Empresa actualizada correctamente');
                this.closeEditModal();
                this.loadEmpresas();
            }
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo actualizar la empresa');
        }
    }

    async handleDeleteEmpresa(id) {
        if (!confirm('¿Está seguro de que desea eliminar esta empresa?')) {
            return;
        }

        try {
            const response = await EmpresasAPI.delete(id);
            
            if (response.success) {
                toast.success('Éxito', 'Empresa eliminada correctamente');
                this.loadEmpresas();
            }
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo eliminar la empresa');
        }
    }
}

// =====================================================
// CONTROLADOR DE EDICIÓN DE REGISTROS
// =====================================================

class EditRegistroController {
    constructor() {
        // Modal
        this.editRegistroModal = document.getElementById('editRegistroModal');
        this.closeEditRegistroModal = document.getElementById('closeEditRegistroModal');
        this.cancelEditRegistro = document.getElementById('cancelEditRegistro');
        this.confirmEditRegistro = document.getElementById('confirmEditRegistro');
        this.deleteRegistroBtn = document.getElementById('deleteRegistroBtn');
        this.editRegistroForm = document.getElementById('editRegistroForm');

        // Campos
        this.editRegistroId = document.getElementById('editRegistroId');
        this.editRegistroFecha = document.getElementById('editRegistroFecha');
        this.editRegistroEmpresa = document.getElementById('editRegistroEmpresa');
        this.editRegistroPrefijo = document.getElementById('editRegistroPrefijo');
        this.editRegistroVehiculo = document.getElementById('editRegistroVehiculo');
        this.editRegistroTabla = document.getElementById('editRegistroTabla');
        this.editRegistroConductor = document.getElementById('editRegistroConductor');
        this.editRegistroHoraInicio = document.getElementById('editRegistroHoraInicio');
        this.editRegistroHoraFin = document.getElementById('editRegistroHoraFin');
        this.editRegistroServicio = document.getElementById('editRegistroServicio');
        this.editRegistroNovedad = document.getElementById('editRegistroNovedad');

        this.init();
    }

    init() {
        // Validar que el elemento principal exista
        if (this.editRegistroModal) {
            this.setupEventListeners();
            this.loadEmpresas();
        }
    }

    setupEventListeners() {
        if (this.closeEditRegistroModal) {
            this.closeEditRegistroModal.addEventListener('click', () => this.closeModal());
        }
        if (this.cancelEditRegistro) {
            this.cancelEditRegistro.addEventListener('click', () => this.closeModal());
        }
        if (this.confirmEditRegistro) {
            this.confirmEditRegistro.addEventListener('click', () => this.handleUpdateRegistro());
        }
        if (this.deleteRegistroBtn) {
            this.deleteRegistroBtn.addEventListener('click', () => this.handleDeleteRegistro());
        }

        // Cambio de empresa
        if (this.editRegistroEmpresa) {
            this.editRegistroEmpresa.addEventListener('change', () => this.handleEmpresaChange());
        }

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editRegistroModal && this.editRegistroModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    async loadEmpresas() {
        try {
            const response = await EmpresasAPI.getAll();
            
            if (response.success && this.editRegistroEmpresa) {
                this.editRegistroEmpresa.innerHTML = response.data
                    .map(e => `<option value="${escapeHtml(e.nombre)}">${escapeHtml(e.nombre)}</option>`)
                    .join('');
            }
        } catch (error) {
            console.error('Error cargando empresas:', error);
        }
    }

    handleEmpresaChange() {
        if (!this.editRegistroEmpresa || !this.editRegistroPrefijo) return;
        
        const empresa = this.editRegistroEmpresa.value;
        const prefijo = getEmpresaPrefijo(empresa);
        this.editRegistroPrefijo.value = prefijo;
    }

    openModal(registro) {
        if (!this.editRegistroModal) return;
        
        if (this.editRegistroId) this.editRegistroId.value = registro.id;
        if (this.editRegistroFecha) this.editRegistroFecha.value = registro.fecha;
        if (this.editRegistroEmpresa) this.editRegistroEmpresa.value = registro.empresa;
        if (this.editRegistroPrefijo) this.editRegistroPrefijo.value = registro.prefijo;
        if (this.editRegistroVehiculo) this.editRegistroVehiculo.value = registro.vehiculo;
        if (this.editRegistroTabla) this.editRegistroTabla.value = registro.tabla;
        if (this.editRegistroConductor) this.editRegistroConductor.value = registro.conductor;
        if (this.editRegistroHoraInicio) this.editRegistroHoraInicio.value = registro.hora_inicio;
        if (this.editRegistroHoraFin) this.editRegistroHoraFin.value = registro.hora_fin;
        if (this.editRegistroServicio) this.editRegistroServicio.value = registro.servicio;
        if (this.editRegistroNovedad) this.editRegistroNovedad.value = registro.novedad || '';

        this.editRegistroModal.classList.add('active');
    }

    closeModal() {
        if (this.editRegistroModal) {
            this.editRegistroModal.classList.remove('active');
        }
    }

    async handleUpdateRegistro() {
        if (!this.editRegistroId) return;
        
        const id = this.editRegistroId.value;
        const data = {
            fecha: this.editRegistroFecha ? this.editRegistroFecha.value : '',
            empresa: this.editRegistroEmpresa ? this.editRegistroEmpresa.value : '',
            prefijo: this.editRegistroPrefijo ? this.editRegistroPrefijo.value : '',
            vehiculo: this.editRegistroVehiculo ? this.editRegistroVehiculo.value.trim() : '',
            tabla: this.editRegistroTabla ? this.editRegistroTabla.value.trim() : '',
            conductor: this.editRegistroConductor ? this.editRegistroConductor.value.trim() : '',
            hora_inicio: this.editRegistroHoraInicio ? this.editRegistroHoraInicio.value : '',
            hora_fin: this.editRegistroHoraFin ? this.editRegistroHoraFin.value : '',
            servicio: this.editRegistroServicio ? this.editRegistroServicio.value.trim() : '',
            novedad: this.editRegistroNovedad ? this.editRegistroNovedad.value.trim() : ''
        };

        try {
            const response = await FormularioAPI.update(id, data);
            
            if (response.success) {
                toast.success('Éxito', 'Registro actualizado correctamente');
                this.closeModal();
                // Recargar tabla
                if (window.dashboardController) {
                    window.dashboardController.loadData();
                }
            }
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo actualizar el registro');
        }
    }

    async handleDeleteRegistro() {
        if (!confirm('¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.')) {
            return;
        }

        if (!this.editRegistroId) return;
        
        const id = this.editRegistroId.value;

        try {
            const response = await FormularioAPI.delete(id);
            
            if (response.success) {
                toast.success('Éxito', 'Registro eliminado correctamente');
                this.closeModal();
                // Recargar tabla
                if (window.dashboardController) {
                    window.dashboardController.loadData();
                }
            }
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo eliminar el registro');
        }
    }
}

