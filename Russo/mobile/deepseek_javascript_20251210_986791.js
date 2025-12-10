import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import * as SplashScreen from 'expo-splash-screen';

// Importaciones de la app
import AppNavigator from './src/navigation/AppNavigator';
import { RussoTheme } from './src/utils/theme';
import { RussoProvider } from './src/context/RussoContext';
import { RussoLoader } from './src/components/RussoLoader';
import { setupBackgroundTasks } from './src/services/background/syncService';

// Mantener splash screen visible
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Inicializar servicios
        await setupBackgroundTasks();
        
        // Simular carga de recursos
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        
        // Ocultar splash después de la animación
        setTimeout(async () => {
          setShowAnimation(false);
          await SplashScreen.hideAsync();
        }, 3000);
      }
    }

    prepare();
  }, []);

  if (!appIsReady || showAnimation) {
    return <RussoLoader />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={RussoTheme}>
        <RussoProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <StatusBar style="light" backgroundColor="#0A0A0A" />
        </RussoProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}