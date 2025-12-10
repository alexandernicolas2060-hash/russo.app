import AsyncStorage from '@react-native-async-storage/async-storage';

export const LocalStorage = {
  // Guardar datos
  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  },

  // Obtener datos
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  // Eliminar datos
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  // Limpiar todo
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  // Obtener múltiples claves
  async multiGet(keys) {
    try {
      const values = await AsyncStorage.multiGet(keys);
      return values.reduce((acc, [key, value]) => {
        acc[key] = value ? JSON.parse(value) : null;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error multi-get:', error);
      return {};
    }
  },

  // Guardar múltiples claves
  async multiSet(items) {
    try {
      const stringItems = items.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(stringItems);
      return true;
    } catch (error) {
      console.error('Error multi-set:', error);
      return false;
    }
  },

  // Claves específicas de la app
  async getUser() {
    return this.get('@russo_user');
  },

  async setUser(user) {
    return this.set('@russo_user', user);
  },

  async getToken() {
    return this.get('@russo_token');
  },

  async setToken(token) {
    return this.set('@russo_token', token);
  },

  async getCart() {
    return this.get('@russo_cart');
  },

  async setCart(cart) {
    return this.set('@russo_cart', cart);
  },

  async getSettings() {
    return this.get('@russo_settings');
  },

  async setSettings(settings) {
    return this.set('@russo_settings', settings);
  },

  async getFavorites() {
    return this.get('@russo_favorites');
  },

  async setFavorites(favorites) {
    return this.set('@russo_favorites', favorites);
  },

  // Cache de productos
  async getProductCache() {
    return this.get('@russo_product_cache');
  },

  async setProductCache(products) {
    return this.set('@russo_product_cache', products);
  },

  // Historial de búsqueda
  async getSearchHistory() {
    return this.get('@russo_search_history') || [];
  },

  async addSearchHistory(query) {
    try {
      const history = await this.getSearchHistory();
      const filtered = history.filter(item => item !== query);
      const updated = [query, ...filtered].slice(0, 10);
      await this.set('@russo_search_history', updated);
      return updated;
    } catch (error) {
      console.error('Error adding search history:', error);
      return [];
    }
  },

  async clearSearchHistory() {
    return this.set('@russo_search_history', []);
  },

  // Widgets personalizados
  async getWidgets() {
    return this.get('@russo_widgets') || [];
  },

  async setWidgets(widgets) {
    return this.set('@russo_widgets', widgets);
  },

  // Datos offline
  async getOfflineData() {
    return this.multiGet([
      '@russo_user',
      '@russo_cart',
      '@russo_favorites',
      '@russo_product_cache',
      '@russo_settings',
    ]);
  },

  async setOfflineData(data) {
    return this.multiSet([
      ['@russo_user', data.user],
      ['@russo_cart', data.cart],
      ['@russo_favorites', data.favorites],
      ['@russo_product_cache', data.products],
      ['@russo_settings', data.settings],
    ]);
  },

  // Verificar si hay datos offline
  async hasOfflineData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.some(key => key.startsWith('@russo_'));
    } catch (error) {
      console.error('Error checking offline data:', error);
      return false;
    }
  },

  // Limpiar cache (mantener datos de usuario)
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        key => key.startsWith('@russo_') && 
        !key.includes('user') && 
        !key.includes('token') && 
        !key.includes('settings')
      );
      
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },

  // Backup de datos
  async createBackup() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backup = {};
      
      for (const key of keys) {
        if (key.startsWith('@russo_')) {
          const value = await AsyncStorage.getItem(key);
          backup[key] = value;
        }
      }
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  },

  // Restaurar backup
  async restoreBackup(backup) {
    try {
      const items = Object.entries(backup).map(([key, value]) => [key, value]);
      await AsyncStorage.multiSet(items);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  },
};