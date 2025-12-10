import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { RussoAPI } from './RussoAPI';

export const RussoAuth = {
  // Registro
  async register(userData) {
    try {
      const result = await RussoAPI.register(userData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Login
  async login(phone, password) {
    try {
      const result = await RussoAPI.login(phone, password);
      
      // Guardar credenciales para autenticación biométrica
      await this.saveCredentialsForBiometric(phone, password);
      
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Verificación
  async verify(phone, code) {
    try {
      const result = await RussoAPI.verify(phone, code);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      // Limpiar almacenamiento
      await AsyncStorage.multiRemove([
        '@russo_token',
        '@russo_refresh_token',
        '@russo_user',
        '@russo_credentials',
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Usuario actual
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem('@russo_user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      
      // Si no hay usuario en cache, obtener del servidor
      return await RussoAPI.getProfile();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Actualizar perfil
  async updateProfile(userData) {
    try {
      const result = await RussoAPI.updateProfile(userData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si está autenticado
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('@russo_token');
      const user = await this.getCurrentUser();
      
      return !!(token && user);
    } catch (error) {
      return false;
    }
  },

  // Autenticación biométrica
  async authenticateWithBiometric() {
    try {
      // Verificar si la biometría está disponible
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometría no disponible');
      }

      // Autenticar
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate para acceder a Russo',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Obtener credenciales guardadas
        const credentials = await this.getBiometricCredentials();
        if (credentials) {
          return credentials;
        }
      }

      throw new Error('Autenticación biométrica fallida');
    } catch (error) {
      throw error;
    }
  },

  // Guardar credenciales para biometría
  async saveCredentialsForBiometric(phone, password) {
    try {
      const settings = await AsyncStorage.getItem('@russo_settings');
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      if (parsedSettings.biometricAuth) {
        await AsyncStorage.setItem(
          '@russo_credentials',
          JSON.stringify({ phone, password })
        );
      }
    } catch (error) {
      console.error('Save credentials error:', error);
    }
  },

  // Obtener credenciales biométricas
  async getBiometricCredentials() {
    try {
      const credentialsJson = await AsyncStorage.getItem('@russo_credentials');
      return credentialsJson ? JSON.parse(credentialsJson) : null;
    } catch (error) {
      console.error('Get credentials error:', error);
      return null;
    }
  },

  // Cambiar contraseña
  async changePassword(oldPassword, newPassword) {
    try {
      // TODO: Implementar cambio de contraseña en el backend
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  },

  // Eliminar cuenta
  async deleteAccount() {
    try {
      // TODO: Implementar eliminación de cuenta en el backend
      await this.logout();
    } catch (error) {
      throw error;
    }
  },

  // Recuperar contraseña
  async requestPasswordReset(phone) {
    try {
      // TODO: Implementar solicitud de restablecimiento
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  },

  // Verificar código de recuperación
  async verifyResetCode(phone, code) {
    try {
      // TODO: Implementar verificación de código
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  },

  // Restablecer contraseña
  async resetPassword(phone, code, newPassword) {
    try {
      // TODO: Implementar restablecimiento
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  },
};