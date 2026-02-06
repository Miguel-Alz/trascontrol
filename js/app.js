/**
 * =====================================================
 * APP.JS - Lógica del Formulario de Conductores
 * Sistema de Registro de Conductores
 * =====================================================
 */

// =====================================================
// CONTROLADOR PRINCIPAL DEL FORMULARIO
// =====================================================

class FormController {
    constructor() {
        // Elementos del DOM
        this.form = document.getElementById('conductorForm');
        this.btnSubmit = document.getElementById('btnSubmit');
        this.btnReset = document.getElementById('btnReset');
        this.btnNewRecord = document.getElementById('btnNewRecord');
        this.successOverlay = document.getElementById('successOverlay');
        
        // Campos del formulario
        this.fields = {
            fecha: document.getElementById('fecha'),
            empresa: document.getElementById('empresa'),
            prefijo: document.getElementById('prefijo'),
            vehiculo: document.getElementById('vehiculo'),
            tabla: document.getElementById('tabla'),
            conductor: document.getElementById('conductor'),
            hora_inicio: document.getElementById('hora_inicio'),
            hora_fin: document.getElementById('hora_fin'),
            servicio: document.getElementById('servicio'),
            novedad: document.getElementById('novedad')
        };

        // Autocomplete del conductor
        this.conductorDropdown = document.getElementById('conductorDropdown');
        this.conductorList = document.getElementById('conductorList');
        this.allConductores = [];

        // Validador
        this.validator = new FormValidator(this.form);

        // Inicializar
        this.init();
    }

    /**
     * Inicializa el controlador
     */
    init() {
        this.setupEventListeners();
        this.setDefaultValues();
        this.loadConductores();
        this.validator.enableRealTimeValidation();
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Envío del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Botón de limpiar
        this.btnReset.addEventListener('click', () => this.resetForm());

        // Botón de nuevo registro (en el overlay de éxito)
        this.btnNewRecord.addEventListener('click', () => this.startNewRecord());

        // Cambio de empresa -> autocompletar prefijo
        this.fields.empresa.addEventListener('change', (e) => this.handleEmpresaChange(e));

        // Autocomplete del conductor
        this.fields.conductor.addEventListener('input', (e) => this.handleConductorInput(e));
        this.fields.conductor.addEventListener('blur', () => {
            setTimeout(() => this.closeConductorDropdown(), 200);
        });
        this.fields.conductor.addEventListener('focus', () => {
            if (this.fields.conductor.value) {
                this.openConductorDropdown();
            }
        });

        // Prevenir cerrar la página con datos sin guardar
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    /**
     * Establece valores por defecto
     */
    setDefaultValues() {
        // Fecha actual (formato local YYYY-MM-DD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        this.fields.fecha.value = `${year}-${month}-${day}`;
        
        // Hora actual redondeada a 15 minutos
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(Math.round(now.getMinutes() / 15) * 15 % 60).padStart(2, '0');
        this.fields.hora_inicio.value = `${hours}:${minutes}`;
    }

    /**
     * Carga la lista de conductores
     */
    async loadConductores() {
        try {
            const empresa = this.fields.empresa.value;
            const response = await FormularioAPI.getConductores(empresa);
            
            if (response.success) {
                this.allConductores = response.data;
                this.updateConductorDatalist();
            }
        } catch (error) {
            console.error('Error cargando conductores:', error);
        }
    }

    /**
     * Actualiza el datalist de conductores
     */
    updateConductorDatalist() {
        this.conductorList.innerHTML = this.allConductores
            .map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`)
            .join('');
    }

    /**
     * Maneja el input del conductor (búsqueda)
     */
    handleConductorInput(e) {
        const value = e.target.value.trim();
        
        if (!value) {
            this.closeConductorDropdown();
            return;
        }

        const filtered = this.allConductores.filter(c => 
            c.nombre.toLowerCase().includes(value.toLowerCase())
        );

        this.renderConductorDropdown(filtered);
    }

    /**
     * Renderiza el dropdown de conductores
     */
    renderConductorDropdown(conductores) {
        if (conductores.length === 0) {
            this.closeConductorDropdown();
            return;
        }

        this.conductorDropdown.innerHTML = conductores
            .map(c => `
                <div class="conductor-option" data-id="${c.id}" data-name="${escapeHtml(c.nombre)}">
                    <div class="conductor-option-name">${escapeHtml(c.nombre)}</div>
                    <div class="conductor-option-meta">
                        ${c.cedula ? `Cédula: ${escapeHtml(c.cedula)} • ` : ''}
                        ${c.empresa ? escapeHtml(c.empresa) : 'Sin empresa'}
                    </div>
                </div>
            `)
            .join('');

        this.openConductorDropdown();

        // Agregar event listeners a las opciones
        this.conductorDropdown.querySelectorAll('.conductor-option').forEach(option => {
            option.addEventListener('click', () => {
                this.fields.conductor.value = option.dataset.name;
                this.closeConductorDropdown();
                this.fields.conductor.blur();
            });
        });
    }

    /**
     * Abre el dropdown de conductores
     */
    openConductorDropdown() {
        this.conductorDropdown.classList.remove('hidden');
    }

    /**
     * Cierra el dropdown de conductores
     */
    closeConductorDropdown() {
        this.conductorDropdown.classList.add('hidden');
    }

    /**
     * Maneja el cambio de empresa para autocompletar el prefijo
     */
    handleEmpresaChange(e) {
        const empresa = e.target.value;
        const prefijo = getEmpresaPrefijo(empresa);
        
        this.fields.prefijo.value = prefijo;
        
        // Recargar conductores de la empresa seleccionada
        this.loadConductores();
        
        // Animación de feedback
        if (prefijo) {
            this.fields.prefijo.classList.add('is-valid');
            setTimeout(() => {
                this.fields.prefijo.classList.remove('is-valid');
            }, 1500);
        }
    }

    /**
     * Maneja el envío del formulario
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Validar formulario
        if (!this.validator.validate()) {
            // Enfocar el primer campo con error
            const firstError = this.validator.errors[0];
            if (firstError && firstError.element) {
                firstError.element.focus();
            }
            toast.error('Error de validación', 'Por favor complete todos los campos requeridos');
            return;
        }

        // Obtener datos del formulario
        const formData = this.getFormData();

        // Mostrar estado de carga
        this.setLoadingState(true);

        try {
            // Enviar al servidor
            const response = await FormularioAPI.create(formData);

            if (response.success) {
                // Mostrar overlay de éxito
                this.showSuccessOverlay();
                
                // Marcar que los datos fueron guardados
                this.dataSaved = true;
            }
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            toast.error('Error al guardar', error.message || 'No se pudo guardar el registro. Intente nuevamente.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        return {
            fecha: this.fields.fecha.value,
            empresa: this.fields.empresa.value,
            prefijo: this.fields.prefijo.value,
            vehiculo: this.fields.vehiculo.value.trim(),
            tabla: this.fields.tabla.value.trim(),
            conductor: this.fields.conductor.value.trim(),
            hora_inicio: this.fields.hora_inicio.value,
            hora_fin: this.fields.hora_fin.value,
            servicio: this.fields.servicio.value.trim(),
            novedad: this.fields.novedad.value.trim()
        };
    }

    /**
     * Establece el estado de carga del botón
     */
    setLoadingState(loading) {
        if (loading) {
            this.btnSubmit.classList.add('loading');
            this.btnSubmit.disabled = true;
        } else {
            this.btnSubmit.classList.remove('loading');
            this.btnSubmit.disabled = false;
        }
    }

    /**
     * Muestra el overlay de éxito
     */
    showSuccessOverlay() {
        this.successOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Oculta el overlay de éxito
     */
    hideSuccessOverlay() {
        this.successOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Inicia un nuevo registro
     */
    startNewRecord() {
        this.hideSuccessOverlay();
        this.resetForm();
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Enfocar primer campo
        setTimeout(() => {
            this.fields.fecha.focus();
        }, 300);
    }

    /**
     * Limpia el formulario
     */
    resetForm() {
        // Limpiar todos los campos
        this.form.reset();
        
        // Restablecer valores por defecto
        this.setDefaultValues();
        
        // Limpiar estados de validación
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        // Limpiar prefijo
        this.fields.prefijo.value = '';
        
        // Marcar como datos no guardados
        this.dataSaved = true;

        // Cerrar dropdown del conductor
        this.closeConductorDropdown();
    }
};
// =====================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FormController();
    });
} else {
    new FormController();
}

// =====================================================
// EFECTOS VISUALES ADICIONALES
// =====================================================

// Efecto parallax sutil en el fondo
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    document.body.style.setProperty('--mouse-x', `${x * 100}%`);
    document.body.style.setProperty('--mouse-y', `${y * 100}%`);
});


