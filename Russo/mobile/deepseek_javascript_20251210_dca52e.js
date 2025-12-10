import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import { RussoAPI } from '../RussoAPI';
import { syncNotifications } from './notificationService';

// Configurar sincronización en segundo plano
export const setupBackgroundSync = () => {
  // Configurar BackgroundFetch
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minutos (15 es el mínimo en iOS)
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('[BackgroundFetch] taskId:', taskId);
      
      try {
        await performSync();
        BackgroundFetch.finish(taskId);
      } catch (error) {
        console.error('[BackgroundFetch] error:', error);
        BackgroundFetch.finish(taskId);
      }
    },
    (error) => {
      console.error('[BackgroundFetch] failed to start:', error);
    }
  );
};

// Realizar sincronización completa
export const performSync = async () => {
  try {
    // Verificar conexión
    const isConnected = await RussoAPI.checkConnection();
    if (!isConnected) {
      return { success: false, reason: 'no_connection' };
    }

    // Obtener última sincronización
    const lastSync = await AsyncStorage.getItem('@russo_last_sync');
    const lastSyncTime = lastSync ? parseInt(lastSync) : 0;
    const now = Date.now();

    // Sincronizar en orden de prioridad
    const results = {
      notifications: false,
      cart: false,
      profile: false,
      products: false,
    };

    // 1. Notificaciones (siempre sincronizar)
    try {
      await syncNotifications();
      results.notifications = true;
    } catch (error) {
      console.error('Sync notifications error:', error);
    }

    // 2. Carrito (cada 5 minutos)
    if (now - lastSyncTime > 5 * 60 * 1000) {
      try {
        await syncCart();
        results.cart = true;
      } catch (error) {
        console.error('Sync cart error:', error);
      }
    }

    // 3. Perfil (cada 30 minutos)
    if (now - lastSyncTime > 30 * 60 * 1000) {
      try {
        await syncProfile();
        results.profile = true;
      } catch (error) {
        console.error('Sync profile error:', error);
      }
    }

    // 4. Productos destacados (cada hora)
    if (now - lastSyncTime > 60 * 60 * 1000) {
      try {
        await syncFeaturedProducts();
        results.products = true;
      } catch (error) {
        console.error('Sync products error:', error);
      }
    }

    // Actualizar última sincronización
    await AsyncStorage.setItem('@russo_last_sync', now.toString());

    return { success: true, results };
  } catch (error) {
    console.error('Perform sync error:', error);
    return { success: false, error: error.message };
  }
};

// Sincronizar carrito
const syncCart = async () => {
  try {
    const cart = await RussoAPI.getCart();
    await AsyncStorage.setItem('@russo_cart_cache', JSON.stringify(cart));
    return cart;
  } catch (error) {
    throw error;
  }
};

// Sincronizar perfil
const syncProfile = async () => {
  try {
    const profile = await RussoAPI.getProfile();
    await AsyncStorage.setItem('@russo_user', JSON.stringify(profile));
    return profile;
  } catch (error) {
    throw error;
  }
};

// Sincronizar productos destacados
const syncFeaturedProducts = async () => {
  try {
    const featured = await RussoAPI.getFeaturedProduct();
    await AsyncStorage.setItem('@russo_featured_cache', JSON.stringify(featured));
    return featured;
  } catch (error) {
    throw error;
  }
};

// Sincronizar manualmente
export const manualSync = async () => {
  try {
    const result = await performSync();
    
    if (result.success) {
      return {
        success: true,
        message: 'Sincronización completada',
        results: result.results,
      };
    } else {
      return {
        success: false,
        message: 'Error en sincronización',
        error: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error en sincronización',
      error: error.message,
    };
  }
};

// Verificar estado de sincronización
export const getSyncStatus = async () => {
  try {
    const lastSync = await AsyncStorage.getItem('@russo_last_sync');
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    return {
      lastSync: lastSync ? parseInt(lastSync) : null,
      isConnected,
      lastSyncFormatted: lastSync 
        ? new Date(parseInt(lastSync)).toLocaleString() 
        : 'Nunca',
    };
  } catch (error) {
    console.error('Get sync status error:', error);
    return null;
  }
};

// Configurar sincronización automática
export const setupAutoSync = (intervalMinutes = 15) => {
  // Usar BackgroundFetch para sincronización periódica
  setupBackgroundSync();
  
  // Sincronizar al iniciar la app
  performSync();
  
  // Sincronizar cuando se restablece la conexión
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      performSync();
    }
  });
};