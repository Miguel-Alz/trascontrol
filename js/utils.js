/**
 * =====================================================
 * UTILIDADES - Funciones compartidas
 * Sistema de Registro de Conductores
 * =====================================================
 */

// =====================================================
// CONFIGURACIÓN GLOBAL
// =====================================================

const CONFIG = {
    // Mapeo de empresas con sus prefijos
    empresas: {
        'Urbanos Cañarte': 'UC',
        'Transperla del Otún': 'TP',
        'Servilujo': 'SL'
    },
    
    // Configuración de la API
    api: {
        baseUrl: '/api',
        timeout: 10000
    },
    
    // Configuración de paginación
    pagination: {
        itemsPerPage: 10
    },
    
    // Configuración de toasts
    toast: {
        duration: 4000
    }
};

// =====================================================
// SISTEMA DE NOTIFICACIONES (TOASTS)
// =====================================================

class ToastManager {
    constructor(containerId = 'toastContainer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show({ type = 'info', title, message, duration = CONFIG.toast.duration }) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));

        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    hide(toast) {
        if (!toast || toast.classList.contains('hiding')) return;
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(title, message) { return this.show({ type: 'success', title, message }); }
    error(title, message) { return this.show({ type: 'error', title, message }); }
    warning(title, message) { return this.show({ type: 'warning', title, message }); }
    info(title, message) { return this.show({ type: 'info', title, message }); }
}

const toast = new ToastManager();

// =====================================================
// VALIDACIÓN DE FORMULARIOS
// =====================================================

class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = [];
    }

    validate() {
        this.errors = [];
        const inputs = this.form.querySelectorAll('[required]');
        
        inputs.forEach(input => {
            this.validateField(input);
        });

        return this.errors.length === 0;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        this.clearFieldError(field);

        if (field.hasAttribute('required') && !value) {
            this.setFieldError(field, 'Este campo es obligatorio');
            isValid = false;
        }

        if (value && isValid) {
            if (field.type === 'time' && field.id === 'hora_fin') {
                const horaInicio = this.form.querySelector('#hora_inicio');
                if (horaInicio && horaInicio.value && value < horaInicio.value) {
                    this.setFieldError(field, 'La hora fin debe ser mayor a la hora inicio');
                    isValid = false;
                }
            }
        }

        if (!isValid) {
            this.errors.push({ field: field.name || field.id, element: field });
        }

        return isValid;
    }

    setFieldError(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        const errorElement = field.parentElement.querySelector('.form-error') ||
                            field.closest('.form-group')?.querySelector('.form-error');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');
        
        const errorElement = field.parentElement.querySelector('.form-error') ||
                            field.closest('.form-group')?.querySelector('.form-error');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    setFieldValid(field) {
        this.clearFieldError(field);
        if (field.value.trim()) {
            field.classList.add('is-valid');
        }
    }

    enableRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.hasAttribute('required') || input.value.trim()) {
                    if (this.validateField(input)) {
                        this.setFieldValid(input);
                    }
                }
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    if (this.validateField(input)) {
                        this.setFieldValid(input);
                    }
                }
            });
        });
    }
}

// =====================================================
// HELPERS DE FECHA Y HORA
// =====================================================

const DateUtils = {
    today() {
        return new Date().toISOString().split('T')[0];
    },

    format(dateString, locale = 'es-CO') {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    formatTime(time) {
        if (!time) return '';
        return time;
    },

    firstDayOfMonth() {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    },

    lastDayOfMonth() {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    }
};

// =====================================================
// HELPERS DE ALMACENAMIENTO
// =====================================================

const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
};

// =====================================================
// HELPERS GENERALES
// =====================================================

function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function truncate(str, length = 50) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length).trim() + '...';
}

function formatNumber(num, locale = 'es-CO') {
    return new Intl.NumberFormat(locale).format(num);
}

function getEmpresaPrefijo(empresa) {
    return CONFIG.empresas[empresa] || '';
}

// =====================================================
// EXPORTAR PARA USO GLOBAL
// =====================================================

window.CONFIG = CONFIG;
window.toast = toast;
window.ToastManager = ToastManager;
window.FormValidator = FormValidator;
window.DateUtils = DateUtils;
window.Storage = Storage;
window.debounce = debounce;
window.escapeHtml = escapeHtml;
window.generateId = generateId;
window.truncate = truncate;
window.formatNumber = formatNumber;
window.getEmpresaPrefijo = getEmpresaPrefijo;
