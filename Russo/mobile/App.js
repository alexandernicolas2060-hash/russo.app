import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Animated, Easing, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Servicios
import RussoAPI from './src/services/RussoAPI';
import BackgroundService from './src/services/BackgroundService';

// Pantallas
import SplashScreenComponent from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProductScreen from './src/screens/ProductScreen';
import CartScreen from './src/screens/CartScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MenuScreen from './src/screens/MenuScreen';

// Componentes
import RussoHeader from './src/components/RussoHeader';
import RussoNotification from './src/components/RussoNotification';

// Utilidades
import { THEMES, applyTheme } from './src/utils/themes';
import { loadLanguage } from './src/utils/localization';

const Stack = createStackNavigator();

// Mantener SplashScreen visible
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(THEMES.dark_gold);
  const [notification, setNotification] = useState(null);
  const appState = useRef(AppState.currentState);

  // Animación logo
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeApp();
    startBackgroundService();
  }, []);

  const initializeApp = async () => {
    try {
      // Cargar configuración
      const savedTheme = await AsyncStorage.getItem('russo_theme');
      const savedUser = await AsyncStorage.getItem('russo_user');
      const savedLanguage = await AsyncStorage.getItem('russo_language');

      if (savedTheme) setTheme(THEMES[savedTheme] || THEMES.dark_gold);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedLanguage) loadLanguage(savedLanguage);

      // Iniciar API
      await RussoAPI.initialize();

      // Animación de logo
      Animated.sequence([
        // Letra R aparece
        Animated.timing(logoAnimation, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true
        }),
        // Transformación a RUSSO
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        }),
        // Logo se mueve arriba
        Animated.timing(logoAnimation, {
          toValue: 2,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();

      // Ocultar splash screen después de 2.5 segundos
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setIsLoading(false);
      }, 2500);

    } catch (error) {
      console.error('Error inicializando app:', error);
      setIsLoading(false);
    }
  };

  const startBackgroundService = () => {
    if (Platform.OS === 'android') {
      BackgroundService.start();
    }
    
    // Escuchar cambios de estado de la app
    AppState.addEventListener('change', handleAppStateChange);
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App volvió al frente
      BackgroundService.syncData();
    }
    appState.current = nextAppState;
  };

  const handleLogin = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('russo_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    AsyncStorage.removeItem('russo_user');
  };

  const changeTheme = async (newTheme) => {
    setTheme(THEMES[newTheme]);
    await AsyncStorage.setItem('russo_theme', newTheme);
    applyTheme(THEMES[newTheme]);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (isLoading) {
    return <SplashScreenComponent 
      logoAnimation={logoAnimation}
      fadeAnimation={fadeAnimation}
    />;
  }

  return (
    <NavigationContainer theme={theme.navigationTheme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.primary}
        translucent={true}
      />
      
      <Stack.Navigator
        initialRouteName={user ? "Home" : "Auth"}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontFamily: 'serif',
            fontSize: 20,
            color: theme.text,
            letterSpacing: 1,
          },
          headerTintColor: theme.accent,
          cardStyle: { backgroundColor: theme.background },
          header: (props) => <RussoHeader {...props} theme={theme} user={user} />,
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            initialParams={{ onLogin: handleLogin }}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              initialParams={{ theme, user }}
              options={{ title: 'RUSSO' }}
            />
            <Stack.Screen 
              name="Product" 
              component={ProductScreen}
              options={({ route }) => ({ 
                title: route.params?.product?.name || 'Producto',
                headerShown: true 
              })}
            />
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ title: 'Carrito Elegante' }}
            />
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen}
              options={{ title: 'Pago Exclusivo' }}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen}
              options={{ 
                title: 'Búsqueda',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              initialParams={{ theme, changeTheme }}
              options={{ title: 'Configuración' }}
            />
            <Stack.Screen 
              name="Menu" 
              component={MenuScreen}
              initialParams={{ user, onLogout: handleLogout }}
              options={{ 
                headerShown: false,
                presentation: 'transparentModal',
                cardOverlayEnabled: true,
                cardStyle: { backgroundColor: 'transparent' }
              }}
            />
          </>
        )}
      </Stack.Navigator>

      {notification && (
        <RussoNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          theme={theme}
        />
      )}
    </NavigationContainer>
  );
}
