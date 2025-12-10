import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { russoApi } from '../services/api/russoApi';
import RussoHeader from '../components/common/RussoHeader';
import CartItem from '../components/cart/CartItem';
import RussoButton from '../components/common/RussoButton';
import RussoLoader from '../components/common/RussoLoader';
import { Feather, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function CartScreen() {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const { 
    cartItems, 
    cartSummary, 
    loading, 
    updateQuantity, 
    removeItem,
    clearCart,
    refreshCart 
  } = useCart();
  
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Animación de entrada
    Animated.spring(cartAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
  }, []);
  
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };
  
  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(itemId);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };
  
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Vaciar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
            } catch (error) {
              Alert.alert('Error', 'No se pudo vaciar el carrito');
            }
          }
        }
      ]
    );
  };
  
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos al carrito antes de continuar');
      return;
    }
    
    // Verificar stock antes de proceder
    const outOfStockItems = cartItems.filter(item => 
      item.stock_quantity !== null && item.quantity > item.stock_quantity
    );
    
    if (outOfStockItems.length > 0) {
      Alert.alert(
        'Stock insuficiente',
        'Algunos productos no tienen stock suficiente. Revisa tu carrito.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // Obtener resumen de checkout
      const checkoutSummary = await russoApi.cart.checkoutSummary();
      
      navigation.navigate('Checkout', {
        checkoutData: checkoutSummary
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo procesar el checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  const handleContinueShopping = () => {
    navigation.navigate('Home');
  };
  
  const cartScale = cartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });
  
  const cartOpacity = cartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  if (loading) {
    return <RussoLoader message="Cargando carrito..." />;
  }
  
  const isEmpty = cartItems.length === 0;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#0A0A0A', '#1A1A1A', '#0A0A0A'] 
          : ['#F5F5F5', '#FFFFFF', '#F5F5F5']}
        style={styles.background}
      />
      
      <RussoHeader
        title="Carrito de Compras"
        onMenuPress={() => navigation.navigate('Menu')}
        onSearchPress={() => navigation.navigate('Search')}
      />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: cartOpacity,
            transform: [{ scale: cartScale }]
          }
        ]}
      >
        {isEmpty ? (
          // Carrito vacío
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.accent, colors.surface]}
              style={styles.emptyCard}
            >
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={[colors.secondary, '#F7EF8A', colors.secondary]}
                  style={styles.emptyIconGradient}
                >
                  <MaterialIcons 
                    name="shopping-bag" 
                    size={60} 
                    color={colors.primary}
                  />
                </LinearGradient>
              </View>
              
              <View style={styles.emptyTextContainer}>
                <Animated.Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Tu carrito está vacío
                </Animated.Text>
                
                <Animated.Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  Explora nuestras exclusividades y añade productos a tu carrito
                </Animated.Text>
              </View>
              
              <RussoButton
                title="Comenzar a comprar"
                onPress={handleContinueShopping}
                gradient
                style={styles.continueButton}
                icon={<Feather name="shopping-bag" size={20} color={colors.primary} />}
              />
            </LinearGradient>
          </View>
        ) : (
          // Carrito con productos
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Encabezado del carrito */}
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleContainer}>
                <LinearGradient
                  colors={[colors.secondary, 'transparent']}
                  style={styles.titleLine}
                />
                <Animated.Text style={[styles.cartTitle, { color: colors.text }]}>
                  TU CARRITO ({cartSummary.total_items} items)
                </Animated.Text>
                <LinearGradient
                  colors={['transparent', colors.secondary]}
                  style={styles.titleLine}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Feather name="trash-2" size={18} color={colors.error} />
                <Animated.Text style={[styles.clearText, { color: colors.error }]}>
                  Vaciar todo
                </Animated.Text>
              </TouchableOpacity>
            </View>
            
            {/* Lista de productos */}
            <View style={styles.itemsContainer}>
              {cartItems.map((item, index) => (
                <CartItem
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  isUpdating={updatingItems.has(item.id)}
                />
              ))}
            </View>
            
            {/* Resumen de compra */}
            <View style={styles.summaryContainer}>
              <LinearGradient
                colors={theme === 'dark' 
                  ? ['rgba(26, 26, 26, 0.9)', 'rgba(10, 10, 10, 0.95)'] 
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(245, 245, 245, 0.95)']}
                style={styles.summaryCard}
              >
                <Animated.Text style={[styles.summaryTitle, { color: colors.text }]}>
                  RESUMEN DE COMPRA
                </Animated.Text>
                
                <View style={styles.summaryRows}>
                  <View style={styles.summaryRow}>
                    <Animated.Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Subtotal ({cartSummary.total_items} items)
                    </Animated.Text>
                    <Animated.Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${cartSummary.subtotal.toFixed(2)}
                    </Animated.Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Animated.Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Envío
                    </Animated.Text>
                    <Animated.Text style={[styles.summaryValue, { 
                      color: cartSummary.shipping_amount > 0 ? colors.text : colors.success 
                    }]}>
                      {cartSummary.shipping_amount > 0 
                        ? `$${cartSummary.shipping_amount.toFixed(2)}` 
                        : 'GRATIS'}
                    </Animated.Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Animated.Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Impuestos
                    </Animated.Text>
                    <Animated.Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${cartSummary.tax_amount.toFixed(2)}
                    </Animated.Text>
                  </View>
                  
                  <View style={styles.separator} />
                  
                  <View style={styles.totalRow}>
                    <Animated.Text style={[styles.totalLabel, { color: colors.text }]}>
                      Total
                    </Animated.Text>
                    <View style={styles.totalValueContainer}>
                      <Animated.Text style={[styles.totalValue, { color: colors.secondary }]}>
                        ${cartSummary.total_amount.toFixed(2)}
                      </Animated.Text>
                      <Animated.Text style={[styles.totalCurrency, { color: colors.textSecondary }]}>
                        USD
                      </Animated.Text>
                    </View>
                  </View>
                </View>
                
                {/* Nota de envío gratis */}
                {cartSummary.subtotal < 100 && (
                  <View style={styles.freeShippingNote}>
                    <Feather name="truck" size={16} color={colors.success} />
                    <Animated.Text style={[styles.freeShippingText, { color: colors.success }]}>
                      ¡Gasta ${(100 - cartSummary.subtotal).toFixed(2)} más para envío GRATIS!
                    </Animated.Text>
                  </View>
                )}
              </LinearGradient>
            </View>
            
            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <RussoButton
                title="Seguir comprando"
                onPress={handleContinueShopping}
                variant="outline"
                style={styles.continueAction}
                icon={<Feather name="arrow-left" size={20} color={colors.text} />}
              />
              
              <RussoButton
                title={`Pagar $${cartSummary.total_amount.toFixed(2)}`}
                onPress={handleCheckout}
                gradient
                loading={checkoutLoading}
                style={styles.checkoutButton}
                icon={<Feather name="lock" size={20} color={colors.primary} />}
              />
            </View>
            
            {/* Información de seguridad */}
            <View style={styles.securityInfo}>
              <View style={styles.securityIcons}>
                <Feather name="shield" size={20} color={colors.success} />
                <Feather name="lock" size={20} color={colors.success} />
                <Feather name="credit-card" size={20} color={colors.success} />
              </View>
              <Animated.Text style={[styles.securityText, { color: colors.textSecondary }]}>
                Pago 100% seguro • Datos encriptados • Sin comisiones ocultas
              </Animated.Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  content: {
    flex: 1,
    marginTop: 100
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyCard: {
    width: '100%',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16
  },
  emptyIconContainer: {
    marginBottom: 24
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12
  },
  emptyTitle: {
    fontFamily: 'ElegantSerif',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center'
  },
  emptyDescription: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8
  },
  continueButton: {
    width: '100%'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8
  },
  cartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  titleLine: {
    width: 20,
    height: 1
  },
  cartTitle: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.1)'
  },
  clearText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1
  },
  itemsContainer: {
    gap: 16,
    marginBottom: 24
  },
  summaryContainer: {
    marginBottom: 24
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  summaryTitle: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20
  },
  summaryRows: {
    gap: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontFamily: 'ElegantSans',
    fontSize: 14
  },
  summaryValue: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '500'
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 16
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontFamily: 'ElegantSerif',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  totalValue: {
    fontFamily: 'ElegantSans',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1
  },
  totalCurrency: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    opacity: 0.7
  },
  freeShippingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 167, 69, 0.1)'
  },
  freeShippingText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  continueAction: {
    flex: 1
  },
  checkoutButton: {
    flex: 2
  },
  securityInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(44, 44, 44, 0.1)'
  },
  securityIcons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12
  },
  securityText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.5
  }
});
