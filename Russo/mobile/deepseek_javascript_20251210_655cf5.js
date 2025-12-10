import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Configuración base
const API_BASE_URL = 'http://localhost:3001/api';

// Instancia de axios con configuración
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@russo_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Manejar error 401 (token expirado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar token
        const refreshToken = await AsyncStorage.getItem('@russo_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { token, refresh_token } = response.data;
          await AsyncStorage.setItem('@russo_token', token);
          if (refresh_token) {
            await AsyncStorage.setItem('@russo_refresh_token', refresh_token);
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Limpiar almacenamiento y redirigir a login
        await AsyncStorage.clear();
        // TODO: Redirigir a pantalla de login
      }
    }

    return Promise.reject(error);
  }
);

// Funciones de la API
export const RussoAPI = {
  // Configuración
  async getConfig() {
    try {
      const response = await api.get('/config/mobile');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Autenticación
  async login(phone, password) {
    try {
      const response = await api.post('/auth/login', { phone, password });
      await AsyncStorage.setItem('@russo_token', response.token);
      if (response.refresh_token) {
        await AsyncStorage.setItem('@russo_refresh_token', response.refresh_token);
      }
      await AsyncStorage.setItem('@russo_user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async verify(phone, code) {
    try {
      const response = await api.post('/auth/verify', { phone, code });
      await AsyncStorage.setItem('@russo_token', response.token);
      await AsyncStorage.setItem('@russo_user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      await AsyncStorage.setItem('@russo_user', JSON.stringify(response.user));
      return response.user;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      await AsyncStorage.setItem('@russo_user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Productos
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.products || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.product;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getFeaturedProduct() {
    try {
      const response = await api.get('/products/featured/latest');
      return response.product;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async searchProducts(query) {
    try {
      const response = await api.get(`/products/search/${encodeURIComponent(query)}`);
      return response.products || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Carrito
  async getCart() {
    try {
      const response = await api.get('/cart');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async addToCart(productId, quantity = 1) {
    try {
      const response = await api.post('/cart/add', { productId, quantity });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateCartItem(itemId, quantity) {
    try {
      const response = await api.put(`/cart/update/${itemId}`, { quantity });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async removeCartItem(itemId) {
    try {
      const response = await api.delete(`/cart/remove/${itemId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async clearCart() {
    try {
      const response = await api.delete('/cart/clear');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Pedidos
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders/create', orderData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getOrders() {
    try {
      const response = await api.get('/orders');
      return response.orders || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getOrder(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.order;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Favoritos
  async getFavorites() {
    try {
      const response = await api.get('/favorites');
      return response.favorites || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async toggleFavorite(productId) {
    try {
      const response = await api.post('/favorites/toggle', { productId });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Widgets
  async getWidgets() {
    try {
      const response = await api.get('/widgets');
      return response.widgets || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateWidget(widgetId, settings) {
    try {
      const response = await api.put(`/widgets/${widgetId}`, settings);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Utilidades
  async checkConnection() {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected;
    } catch (error) {
      console.error('Connection check error:', error);
      return false;
    }
  },

  handleError(error) {
    console.error('API Error:', error);

    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.error || 'Solicitud incorrecta');
        case 401:
          return new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        case 403:
          return new Error('Acceso denegado');
        case 404:
          return new Error('Recurso no encontrado');
        case 500:
          return new Error('Error interno del servidor');
        default:
          return new Error(data.error || 'Error desconocido');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return new Error('Sin conexión al servidor. Verifica tu conexión a internet.');
    } else {
      // Algo pasó al configurar la solicitud
      return new Error('Error de configuración');
    }
  },
};