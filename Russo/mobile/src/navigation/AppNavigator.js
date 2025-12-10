import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Pantallas de autenticación
import AuthScreen from '../screens/AuthScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Pantallas principales
import HomeScreen from '../screens/HomeScreen';
import ProductScreen from '../screens/ProductScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SearchScreen from '../screens/SearchScreen';
import MenuScreen from '../screens/MenuScreen';

// Componentes
import RussoTabBar from '../components/common/RussoTabBar';
import DrawerMenu from '../components/navigation/DrawerMenu';
import RussoLoader from '../components/common/RussoLoader';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Navigator de tabs principal
function MainTabNavigator() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={props => <RussoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.accent,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 70,
          paddingBottom: 8,
          paddingTop: 12
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: 'home'
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: 'search'
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarLabel: 'Carrito',
          tabBarIcon: 'shopping-cart',
          tabBarBadge: true
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: 'user'
        }}
      />
    </Tab.Navigator>
  );
}

// Navigator del drawer
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerMenu {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          width: 320
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.7)'
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}

// Navigator principal de la app
export default function AppNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <RussoLoader message="Cargando..." />;
  }
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0A0A' },
        cardOverlayEnabled: true,
        presentation: 'modal'
      }}
    >
      {!user ? (
        // Flujo de autenticación
        <Stack.Group>
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{
              animationTypeForReplace: user ? 'push' : 'pop'
            }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true
            }}
          />
        </Stack.Group>
      ) : (
        // App principal
        <Stack.Group>
          <Stack.Screen 
            name="Main" 
            component={DrawerNavigator}
            options={{
              gestureEnabled: false
            }}
          />
          <Stack.Group
            screenOptions={{
              presentation: 'modal',
              gestureEnabled: true,
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress.interpolate({
                    inputRange: [0, 0.5, 0.9, 1],
                    outputRange: [0, 0.25, 0.7, 1]
                  })
                },
                overlayStyle: {
                  opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                    extrapolate: 'clamp'
                  })
                }
              })
            }}
          >
            <Stack.Screen 
              name="ProductDetail" 
              component={ProductScreen}
              options={{
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutScreen}
              options={{
                gestureDirection: 'horizontal'
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
            />
            <Stack.Screen 
              name="Menu" 
              component={MenuScreen}
            />
          </Stack.Group>
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
