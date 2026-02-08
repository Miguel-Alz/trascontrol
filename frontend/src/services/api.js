import axios from 'axios';

const API_BASE_URL = '/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;

// =====================================================
// AUTH API
// =====================================================
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.success) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  verify: async () => {
    return await api.get('/auth/verify');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
};

// =====================================================
// EMPRESAS API
// =====================================================
export const empresasAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return api.get(queryString ? `/empresas?${queryString}` : '/empresas');
  },
  getById: (id) => api.get(`/empresas/${id}`),
  create: (data) => api.post('/empresas', data),
  update: (id, data) => api.put(`/empresas/${id}`, data),
  delete: (id) => api.delete(`/empresas/${id}`),
};

// =====================================================
// CONDUCTORES API
// =====================================================
export const conductoresAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return api.get(queryString ? `/conductores?${queryString}` : '/conductores');
  },
  getById: (id) => api.get(`/conductores/${id}`),
  create: (data) => api.post('/conductores', data),
  update: (id, data) => api.put(`/conductores/${id}`, data),
  delete: (id) => api.delete(`/conductores/${id}`),
};

// =====================================================
// RUTAS API
// =====================================================
export const rutasAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return api.get(queryString ? `/rutas?${queryString}` : '/rutas');
  },
  getById: (id) => api.get(`/rutas/${id}`),
  create: (data) => api.post('/rutas', data),
  update: (id, data) => api.put(`/rutas/${id}`, data),
  delete: (id) => api.delete(`/rutas/${id}`),
};

// =====================================================
// TIPO NOVEDADES API
// =====================================================
export const novedadesAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return api.get(queryString ? `/tipo-novedades?${queryString}` : '/tipo-novedades');
  },
  getById: (id) => api.get(`/tipo-novedades/${id}`),
  create: (data) => api.post('/tipo-novedades', data),
  update: (id, data) => api.put(`/tipo-novedades/${id}`, data),
  delete: (id) => api.delete(`/tipo-novedades/${id}`),
};

// =====================================================
// REGISTROS API
// =====================================================
export const registrosAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return api.get(queryString ? `/registros?${queryString}` : '/registros');
  },
  getById: (id) => api.get(`/registros/${id}`),
  create: (data) => api.post('/registros', data),
  update: (id, data) => api.put(`/registros/${id}`, data),
  delete: (id) => api.delete(`/registros/${id}`),
};

// =====================================================
// STATS API
// =====================================================
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
};
