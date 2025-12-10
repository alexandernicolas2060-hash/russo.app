import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Components
import { RussoToast } from '../components/common/RussoToast';

// Services
import { RussoAuth } from '../services/RussoAuth';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function MenuScreen({ navigation }) {
  const theme = useTheme();
  const drawerNavigation = useNavigation();
  
  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeItem, setActiveItem] = useState('home');

  const translateX = useSharedValue(-300);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    // Animación de entrada
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });
    overlayOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 90,
    });

    loadUserData();
    setupMenuItems();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await RussoAuth.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setupMenuItems = () => {
    const items = [
      { id: 'home', icon: 'home', label: 'Inicio', screen: 'Home' },
      { id: 'profile', icon: 'account', label: 'Mi Perfil', screen: 'Profile' },
      { id: 'orders', icon: 'package-variant', label: 'Mis Pedidos', screen: 'Orders' },
      { id: 'favorites', icon: 'heart', label: 'Favoritos', screen: 'Favorites' },
      { id: 'wallet', icon: 'wallet', label: 'Billetera', screen: 'Wallet' },
      { id: 'addresses', icon: 'map-marker', label: 'Direcciones', screen: 'Addresses' },
      { id: 'notifications', icon: 'bell', label: 'Notificaciones', screen: 'Notifications' },
      { id: 'support', icon: 'headphones', label: 'Soporte', screen: 'Support' },
      { id: 'settings', icon: 'cog', label: 'Configuración', screen: 'Settings' },
      { id: 'about', icon: 'information', label: 'Acerca de', screen: 'About' },
    ];
    setMenuItems(items);
  };

  const closeMenu = () => {
    translateX.value = withSpring(-300, {
      damping: 20,
      stiffness: 90,
    });
    overlayOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });
    
    setTimeout(() => {
      drawerNavigation.dispatch(DrawerActions.closeDrawer());
    }, 300);
  };

  const handleMenuItemPress = (item) => {
    setActiveItem(item.id);
    
    if (item.screen) {
      drawerNavigation.navigate(item.screen);
    }
    
    closeMenu();
  };

  const handleLogout = async () => {
    try {
      await RussoAuth.logout();
      drawerNavigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleExternalLink = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const MenuItem = ({ item }) => (
    <AnimatedTouchable
      style={[
        styles.menuItem,
        activeItem === item.id && styles.menuItemActive,
      ]}
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Icon
          name={item.icon}
          size={24}
          color={activeItem === item.id ? '#D4AF37' : '#F5F5F5'}
        />
        <Text
          style={[
            styles.menuItemLabel,
            activeItem === item.id && styles.menuItemLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#666666" />
    </AnimatedTouchable>
  );

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={closeMenu}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
            <Icon name="close" size={24} color="#F5F5F5" />
          </TouchableOpacity>
          
          {/* Perfil del usuario */}
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => handleMenuItemPress({ id: 'profile', screen: 'Profile' })}
          >
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="account" size={40} color="#0A0A0A" />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ''}`
                  : 'Usuario Russo'}
              </Text>
              <Text style={styles.profilePhone}>
                {user?.phone || '+58 414 1234567'}
              </Text>
              <Text style={styles.profileTier}>MIEMBRO EXCLUSIVO</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lista de menú */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>PRINCIPAL</Text>
            {menuItems.slice(0, 4).map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>MI CUENTA</Text>
            {menuItems.slice(4, 8).map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>MÁS</Text>
            {menuItems.slice(8).map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </View>

          {/* Widgets personalizados */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>WIDGETS</Text>
            <View style={styles.widgetsGrid}>
              {[
                { icon: 'view-dashboard', label: 'Mis Widgets' },
                { icon: 'palette', label: 'Personalizar' },
                { icon: 'cog', label: 'Configurar' },
                { icon: 'plus', label: 'Agregar' },
              ].map((widget, index) => (
                <TouchableOpacity key={index} style={styles.widgetItem}>
                  <View style={styles.widgetIcon}>
                    <Icon name={widget.icon} size={20} color="#D4AF37" />
                  </View>
                  <Text style={styles.widgetLabel}>{widget.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Pie de página */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() =>
                handleExternalLink('https://russo.app/terms')
              }
            >
              <Text style={styles.footerLink}>Términos</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity
              onPress={() =>
                handleExternalLink('https://russo.app/privacy')
              }
            >
              <Text style={styles.footerLink}>Privacidad</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity
              onPress={() =>
                handleExternalLink('https://russo.app/help')
              }
            >
              <Text style={styles.footerLink}>Ayuda</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerVersion}>Russo v1.0.0</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#FF4757" />
            <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#0A0A0A',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2C',
    zIndex: 1000,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    marginBottom: 5,
  },
  profileTier: {
    fontSize: 12,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuSection: {
    marginTop: 25,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Bold',
    color: '#666666',
    letterSpacing: 2,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 5,
  },
  menuItemActive: {
    backgroundColor: '#1A1A1A',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
  },
  menuItemLabelActive: {
    color: '#D4AF37',
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  widgetItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    marginBottom: 10,
  },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  widgetLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 15,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#888888',
  },
  footerDivider: {
    fontSize: 12,
    color: '#666666',
  },
  footerVersion: {
    fontSize: 11,
    fontFamily: 'Geist-Regular',
    color: '#444444',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF4757',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    color: '#FF4757',
    letterSpacing: 1,
  },
});