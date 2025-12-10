import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Configuración base
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPS: 3,
  RETRY_DELAY: 1000
};

// Headers comunes
const COMMON_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-App-Platform': Platform.OS,
  'X-App-Version': '1.0.0',
  'X-App-Language': 'es_VE'
};

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: COMMON_HEADERS
});

// Interceptor para añadir token automáticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@russo:auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Añadir timestamp para evitar caché
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta con manejo de errores
api.interceptors.response.use(
  (response) => {
    // Log éxito en desarrollo
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, 
        response.status);
    }
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error
    if (__DEV__) {
      console.log(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`, 
        error.response?.status || error.message);
    }
    
    // Verificar conexión a internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No hay conexión a internet. Verifica tu conexión e intenta nuevamente.');
    }
    
    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          await AsyncStorage.removeItem('@russo:auth_token');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          
        case 403:
          throw new Error('No tienes permisos para realizar esta acción.');
          
        case 404:
          throw new Error('Recurso no encontrado.');
          
        case 422:
          // Errores de validación
          const validationErrors = data.errors || data.error;
          if (Array.isArray(validationErrors)) {
            throw new Error(validationErrors.map(err => err.msg).join('\n'));
          }
          throw new Error(validationErrors || 'Error de validación.');
          
        case 429:
          throw new Error('Demasiadas solicitudes. Por favor, espera un momento.');
          
        case 500:
          throw new Error('Error interno del servidor. Por favor, intenta más tarde.');
          
        default:
          throw new Error(data.error || 'Error desconocido.');
      }
    } else if (error.request) {
      // Error de red o timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
      }
      throw new Error('Error de conexión. Verifica tu internet.');
    } else {
      throw error;
    }
  }
);

// Método para reintentar peticiones fallidas
const retryRequest = async (fn, retries = API_CONFIG.RETRY_ATTEMPS) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
    }
  }
};

// Servicios específicos de la API
export const russoApi = {
  // Configuración
  getConfig: () => api.get('/config/mobile'),
  
  // Salud del servidor
  healthCheck: () => api.get('/health'),
  
  // Autenticación
  auth: {
    register: (data) => api.post('/auth/register', data),
    verify: (data) => api.post('/auth/verify', data),
    login: (data) => api.post('/auth/login', data),
    resendCode: (data) => api.post('/auth/resend-code', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    logout: () => api.post('/auth/logout'),
    verifyToken: () => api.get('/auth/verify-token')
  },
  
  // Productos
  products: {
    getLatest: (limit = 20) => api.get(`/products/latest?limit=${limit}`),
    getFeatured: () => api.get('/products/featured'),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (categoryId, page = 1, limit = 20) => 
      api.get(`/products/category/${categoryId}?page=${page}&limit=${limit}`),
    search: (query, filters = {}) => api.post('/search/products', { query, filters }),
    getRelated: (productId) => api.get(`/products/${productId}/related`),
    getTrending: () => api.get('/products/trending'),
    getOnSale: () => api.get('/products/on-sale')
  },
  
  // Carrito
  cart: {
    get: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
    clear: () => api.delete('/cart/clear'),
    getCount: () => api.get('/cart/count')
  },
  
  // Órdenes
  orders: {
    create: (data) => api.post('/orders', data),
    getAll: (page = 1, limit = 10) => api.get(`/orders?page=${page}&limit=${limit}`),
    getById: (orderId) => api.get(`/orders/${orderId}`),
    cancel: (orderId) => api.post(`/orders/${orderId}/cancel`),
    track: (orderId) => api.get(`/orders/${orderId}/track`),
    getStatus: (orderId) => api.get(`/orders/${orderId}/status`)
  },
  
  // Widgets
  widgets: {
    getAll: () => api.get('/widgets'),
    getUserWidgets: () => api.get('/widgets/user'),
    updateUserWidgets: (data) => api.put('/widgets/user', data),
    getWidgetData: (widgetType) => api.get(`/widgets/data/${widgetType}`),
    reorder: (data) => api.post('/widgets/reorder', data)
  },
  
  // Favoritos
  favorites: {
    getAll: () => api.get('/favorites'),
    add: (productId) => api.post('/favorites', { productId }),
    remove: (productId) => api.delete(`/favorites/${productId}`),
    check: (productId) => api.get(`/favorites/check/${productId}`)
  },
  
  // Búsqueda
  search: {
    products: (query) => api.get(`/search?q=${encodeURIComponent(query)}`),
    suggestions: (query) => api.get(`/search/suggestions?q=${encodeURIComponent(query)}`),
    history: () => api.get('/search/history'),
    clearHistory: () => api.delete('/search/history')
  },
  
  // Notificaciones
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    getSettings: () => api.get('/notifications/settings'),
    updateSettings: (data) => api.put('/notifications/settings', data)
  },
  
  // Categorías
  categories: {
    getAll: () => api.get('/categories'),
    getWithSubcategories: () => api.get('/categories/with-subcategories'),
    getProducts: (categoryId, page = 1) => 
      api.get(`/categories/${categoryId}/products?page=${page}`)
  },
  
  // Direcciones
  addresses: {
    getAll: () => api.get('/addresses'),
    create: (data) => api.post('/addresses', data),
    update: (addressId, data) => api.put(`/addresses/${addressId}`, data),
    delete: (addressId) => api.delete(`/addresses/${addressId}`),
    setDefault: (addressId) => api.put(`/addresses/${addressId}/default`)
  },
  
  // Métodos de pago
  payments: {
    getMethods: () => api.get('/payments/methods'),
    createIntent: (data) => api.post('/payments/intent', data),
    confirm: (paymentId) => api.post(`/payments/${paymentId}/confirm`),
    getHistory: () => api.get('/payments/history')
  },
  
  // Método con reintentos
  retry: retryRequest
};

// Función para verificar conexión antes de hacer peticiones
export const withConnectionCheck = async (fn) => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No hay conexión a internet');
  }
  return fn();
};

// Función para caché de peticiones
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const cachedRequest = async (key, fn, useCache = true) => {
  if (useCache && cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    cache.delete(key);
  }
  
  const data = await fn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Función para limpiar caché
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Función para subir archivos
export const uploadFile = async (file, type = 'image', onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  return api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    }
  });
};

export default api;
