import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

// Iconos (reemplazar con tus iconos reales)
import { 
  Feather, 
  MaterialIcons, 
  Ionicons 
} from '@expo/vector-icons';

export default function RussoHeader({
  onCartPress,
  onMenuPress,
  onSearchPress,
  showLogo = true,
  title,
  rightComponent
}) {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const { cartItems } = useCart();
  
  const [menuActive, setMenuActive] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const cartBadgeAnim = useRef(new Animated.Value(0)).current;
  
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Animación del menú hamburguesa
  const toggleMenu = () => {
    const toValue = menuActive ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(menuAnim, {
        toValue,
        useNativeDriver: true,
        tension: 200,
        friction: 12
      }),
      Animated.spring(cartBadgeAnim, {
        toValue: cartItemsCount > 0 ? 1 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 15
      })
    ]).start();
    
    setMenuActive(!menuActive);
    if (onMenuPress) onMenuPress();
  };
  
  // Animación del badge del carrito
  const cartBadgeScale = cartBadgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
    extrapolate: 'clamp'
  });
  
  // Transformaciones para las líneas del menú
  const line1Rotation = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });
  
  const line1TranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8]
  });
  
  const line2Opacity = menuAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0]
  });
  
  const line3Rotation = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg']
  });
  
  const line3TranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme === 'dark' 
          ? ['rgba(10, 10, 10, 0.95)', 'rgba(10, 10, 10, 0.8)'] 
          : ['rgba(245, 245, 245, 0.95)', 'rgba(245, 245, 245, 0.8)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          {/* Botón menú hamburguesa */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <View style={styles.menuLines}>
              <Animated.View style={[
                styles.menuLine,
                styles.menuLine1,
                {
                  backgroundColor: colors.text,
                  transform: [
                    { rotate: line1Rotation },
                    { translateY: line1TranslateY }
                  ]
                }
              ]} />
              
              <Animated.View style={[
                styles.menuLine,
                styles.menuLine2,
                {
                  backgroundColor: colors.text,
                  opacity: line2Opacity
                }
              ]} />
              
              <Animated.View style={[
                styles.menuLine,
                styles.menuLine3,
                {
                  backgroundColor: colors.text,
                  transform: [
                    { rotate: line3Rotation },
                    { translateY: line3TranslateY }
                  ]
                }
              ]} />
            </View>
          </TouchableOpacity>
          
          {/* Logo o título */}
          <View style={styles.centerContent}>
            {showLogo ? (
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[colors.secondary, '#F7EF8A', colors.secondary]}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.logoInner}>
                    <View style={[
                      styles.logoRVertical,
                      { backgroundColor: colors.primary }
                    ]} />
                    <View style={[
                      styles.logoRCurve,
                      {
                        borderColor: colors.primary,
                        borderLeftWidth: 0
                      }
                    ]} />
                    <View style={[
                      styles.logoRDiagonal,
                      { backgroundColor: colors.primary }
                    ]} />
                  </View>
                </LinearGradient>
                
                <View style={styles.logoTextContainer}>
                  <Animated.Text style={[
                    styles.logoText,
                    { color: colors.text }
                  ]}>
                    usso
                  </Animated.Text>
                </View>
              </View>
            ) : (
              <Animated.Text style={[
                styles.title,
                { color: colors.text }
              ]} numberOfLines={1}>
                {title}
              </Animated.Text>
            )}
          </View>
          
          {/* Iconos de la derecha */}
          <View style={styles.rightContent}>
            {rightComponent || (
              <>
                {/* Botón de búsqueda */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onSearchPress}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name="search" 
                    size={22} 
                    color={colors.text}
                  />
                </TouchableOpacity>
                
                {/* Botón del carrito con badge */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onCartPress}
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name="shopping-bag" 
                    size={24} 
                    color={colors.text}
                  />
                  
                  {cartItemsCount > 0 && (
                    <Animated.View style={[
                      styles.cartBadge,
                      {
                        backgroundColor: colors.secondary,
                        transform: [{ scale: cartBadgeScale }]
                      }
                    ]}>
                      <Animated.Text style={styles.cartBadgeText}>
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </Animated.Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
      
      {/* Línea decorativa inferior */}
      <LinearGradient
        colors={[colors.secondary, 'transparent']}
        style={[styles.bottomLine, { opacity: 0.3 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    ...Platform.select({
      ios: {
        height: 100,
        paddingTop: 50
      },
      android: {
        height: 80,
        paddingTop: 30
      }
    })
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuLines: {
    width: 24,
    height: 18,
    justifyContent: 'space-between'
  },
  menuLine: {
    height: 2,
    borderRadius: 1,
    width: '100%'
  },
  menuLine1: {
    transformOrigin: 'center'
  },
  menuLine2: {
    width: '80%',
    alignSelf: 'center'
  },
  menuLine3: {
    transformOrigin: 'center'
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoGradient: {
    width: 36,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  logoInner: {
    width: 24,
    height: 36,
    position: 'relative'
  },
  logoRVertical: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 6,
    height: 32,
    borderRadius: 3
  },
  logoRCurve: {
    position: 'absolute',
    left: 8,
    top: 2,
    width: 14,
    height: 18,
    borderWidth: 6,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14
  },
  logoRDiagonal: {
    position: 'absolute',
    left: 8,
    top: 20,
    width: 10,
    height: 6,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2
  },
  logoTextContainer: {
    marginLeft: 4
  },
  logoText: {
    fontFamily: 'ElegantSerif',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -4
  },
  title: {
    fontFamily: 'ElegantSerif',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  cartBadgeText: {
    color: '#0A0A0A',
    fontFamily: 'ElegantSans',
    fontSize: 10,
    fontWeight: '900'
  },
  bottomLine: {
    height: 1,
    width: '100%'
  }
});
