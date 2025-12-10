import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { russoApi } from '../services/api/russoApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  // Cargar sesión almacenada al iniciar
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@russo:auth_token');
      const storedUser = await AsyncStorage.getItem('@russo:user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verificar token con el servidor
        try {
          await russoApi.auth.verifyToken();
        } catch (error) {
          // Token inválido, limpiar almacenamiento
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error al cargar autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@russo:auth_token',
        '@russo:user',
        '@russo:cart'
      ]);
      setToken(null);
      setUser(null);
      setError(null);
      setRequiresVerification(false);
    } catch (error) {
      console.error('Error al limpiar autenticación:', error);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.register(userData);
      
      if (response.requiresVerification) {
        setRequiresVerification(true);
        // Guardar datos temporales para verificación
        await AsyncStorage.setItem('@russo:pending_phone', userData.phone);
        await AsyncStorage.setItem('@russo:pending_country', userData.countryCode);
      } else {
        // Registro completo (si no requiere verificación)
        await handleAuthSuccess(response);
      }
      
      return response;
    } catch (error) {
      setError(error.message || 'Error en el registro');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async (verificationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.verify(verificationData);
      
      // Verificación exitosa, completar registro si hay datos pendientes
      const pendingPhone = await AsyncStorage.getItem('@russo:pending_phone');
      const pendingCountry = await AsyncStorage.getItem('@russo:pending_country');
      
      if (pendingPhone && pendingCountry) {
        // Aquí podrías completar el registro con datos adicionales
        await AsyncStorage.multiRemove([
          '@russo:pending_phone',
          '@russo:pending_country'
        ]);
      }
      
      setRequiresVerification(false);
      return response;
    } catch (error) {
      setError(error.message || 'Error en verificación');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async (phoneData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.resendCode(phoneData);
      return response;
    } catch (error) {
      setError(error.message || 'Error al reenviar código');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.login(credentials);
      await handleAuthSuccess(response);
      return response;
    } catch (error) {
      if (error.message.includes('Teléfono no verificado')) {
        setRequiresVerification(true);
        // Guardar teléfono para reenvío de código
        await AsyncStorage.setItem('@russo:pending_phone', credentials.phone);
      }
      setError(error.message || 'Error en inicio de sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (response) => {
    const { token: newToken, user: userData } = response;
    
    // Guardar en estado
    setToken(newToken);
    setUser(userData);
    setRequiresVerification(false);
    setError(null);
    
    // Guardar en almacenamiento
    await AsyncStorage.setItem('@russo:auth_token', newToken);
    await AsyncStorage.setItem('@russo:user', JSON.stringify(userData));
    
    // También podrías sincronizar carrito aquí
    await syncCartAfterLogin();
  };

  const syncCartAfterLogin = async () => {
    try {
      // Sincronizar carrito local con el servidor después de login
      const localCart = await AsyncStorage.getItem('@russo:local_cart');
      if (localCart) {
        const cartItems = JSON.parse(localCart);
        // Aquí sincronizarías cada item con el servidor
        // Por simplicidad, solo limpiamos el carrito local
        await AsyncStorage.removeItem('@russo:local_cart');
      }
    } catch (error) {
      console.error('Error al sincronizar carrito:', error);
    }
  };

  const logout = async () => {
    try {
      await russoApi.auth.logout();
    } catch (error) {
      // Ignorar errores de logout en el servidor
    }
    
    await clearAuth();
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.updateProfile(profileData);
      
      // Actualizar usuario en estado
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      await AsyncStorage.setItem('@russo:user', JSON.stringify(updatedUser));
      
      return response;
    } catch (error) {
      setError(error.message || 'Error al actualizar perfil');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (phoneData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.forgotPassword(phoneData);
      return response;
    } catch (error) {
      setError(error.message || 'Error al solicitar recuperación');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (verificationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.verifyResetCode(verificationData);
      return response;
    } catch (error) {
      setError(error.message || 'Error en verificación de código');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await russoApi.auth.resetPassword(resetData);
      return response;
    } catch (error) {
      setError(error.message || 'Error al restablecer contraseña');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await russoApi.auth.verifyToken();
      // El token sigue siendo válido
      return true;
    } catch (error) {
      // Token expirado o inválido
      await clearAuth();
      return false;
    }
  };

  const checkAuthStatus = async () => {
    if (!token) return false;
    
    try {
      await russoApi.auth.verifyToken();
      return true;
    } catch (error) {
      await clearAuth();
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    requiresVerification,
    register,
    verifyPhone,
    resendVerificationCode,
    login,
    logout,
    updateProfile,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    refreshToken,
    checkAuthStatus,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
