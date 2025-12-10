import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { initializeApp } from './src/services/appInitializer';
import { loadFonts } from './src/utils/fontLoader';
import { setupBackgroundServices } from './src/services/background';
import { registerForPushNotifications } from './src/services/notifications';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Inicializar servicios críticos
        await initializeApp();
        
        // 2. Cargar fuentes personalizadas
        await loadFonts();
        
        // 3. Configurar servicios en segundo plano
        await setupBackgroundServices();
        
        // 4. Registrar para notificaciones push
        await registerForPushNotifications();
        
        // 5. Mostrar splash por 2 segundos
        setTimeout(() => {
          setIsSplashVisible(false);
          setIsReady(true);
        }, 2000);
        
      } catch (error) {
        console.error('Error al inicializar la app:', error);
        setIsReady(true); // Continuar aunque haya error
      }
    }

    prepareApp();
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
