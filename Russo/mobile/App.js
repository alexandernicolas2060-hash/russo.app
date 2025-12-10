import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pantallas
import HomeScreen from './src/screens/HomeScreen';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ProductScreen from './src/screens/ProductScreen';
import CartScreen from './src/screens/CartScreen';
import AuthScreen from './src/screens/AuthScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Servicios
import RussoNetwork from './src/services/RussoNetwork';

const Stack = createStackNavigator();

export default function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      // Verificar si hay backend configurado
      const backendURL = await AsyncStorage.getItem('@russo_backend_url');
      
      if (backendURL) {
        // Probar conexión
        const result = await RussoNetwork.testConnection(backendURL);
        setIsConfigured(result.success);
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Pantalla de carga
    return (
      <div style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#FFF', fontSize: 24 }}>RUSSO</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isConfigured ? (
          // Pantalla de configuración si no hay conexión
          <Stack.Screen 
            name="Connection" 
            component={ConnectionScreen}
            options={{ title: 'Configurar Conexión' }}
          />
        ) : (
          // App principal si está configurada
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'RUSSO' }}
            />
            <Stack.Screen 
              name="Product" 
              component={ProductScreen}
              options={{ title: 'Detalles' }}
            />
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ title: 'Carrito' }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{ title: 'Iniciar Sesión' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Configuración' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
