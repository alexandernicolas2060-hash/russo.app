import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

// Services
import { RussoCart } from '../services/RussoCart';

export default function CartScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = await RussoCart.getCart();
      setCartItems(cart.items || []);
      
      // Seleccionar todos los items por defecto
      const allItemIds = new Set(cart.items?.map(item => item.id) || []);
      setSelectedItems(allItemIds);
    } catch (error) {
      console.error('Error loading cart:', error);
      RussoToast.show('Error al cargar el carrito', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      const allItemIds = new Set(cartItems.map(item => item.id));
      setSelectedItems(allItemIds);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      await RussoCart.updateQuantity(itemId, newQuantity);
      await loadCart();
      RussoToast.show('Cantidad actualizada', 'success');
    } catch (error) {
      RussoToast.show('Error al actualizar cantidad', 'error');
    }
  };

  const removeItem = async (itemId) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de eliminar este producto del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await RussoCart.removeItem(itemId);
              await loadCart();
              RussoToast.show('Producto eliminado', 'success');
            } catch (error) {
              RussoToast.show('Error al eliminar producto', 'error');
            }
          },
        },
      ]
    );
  };

  const removeSelected = async () => {
    if (selectedItems.size === 0) {
      RussoToast.show('Selecciona productos para eliminar', 'info');
      return;
    }

    Alert.alert(
      'Eliminar productos',
      `¿Eliminar ${selectedItems.size} producto(s) del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const itemId of selectedItems) {
                await RussoCart.removeItem(itemId);
              }
              await loadCart();
              setSelectedItems(new Set());
              RussoToast.show('Productos eliminados', 'success');
            } catch (error) {
              RussoToast.show('Error al eliminar productos', 'error');
            }
          },
        },
      ]
    );
  };

  const proceedToCheckout = () => {
    if (selectedItems.size === 0) {
      RussoToast.show('Selecciona productos para comprar', 'info');
      return;
    }

    const selectedProducts = cartItems.filter(item =>
      selectedItems.has(item.id)
    );
    navigation.navigate('Checkout', { items: selectedProducts });
  };

  if (loading) {
    return <RussoLoader />;
  }

  const selectedTotal = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedCount = selectedItems.size;

  return (
    <View style={styles.container}>
      <RussoHeader title="Carrito" showBack={true} />

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cart-off" size={100} color="#2C2C2C" />
          <Text style={styles.emptyTitle}>Carrito vacío</Text>
          <Text style={styles.emptySubtitle}>
            Agrega productos para comenzar a comprar
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.emptyButtonText}>EXPLORAR PRODUCTOS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Controles superiores */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleSelectAll}
            >
              <Icon
                name={
                  selectedItems.size === cartItems.length
                    ? 'checkbox-marked'
                    : 'checkbox-blank-outline'
                }
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.controlText}>
                {selectedItems.size === cartItems.length
                  ? 'Deseleccionar todo'
                  : 'Seleccionar todo'}
              </Text>
            </TouchableOpacity>

            {selectedItems.size > 0 && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={removeSelected}
              >
                <Icon name="trash-can-outline" size={24} color="#FF4757" />
                <Text style={[styles.controlText, { color: '#FF4757' }]}>
                  Eliminar ({selectedItems.size})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de productos */}
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.secondary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemsContainer}>
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelect={() => toggleItemSelection(item.id)}
                  onUpdateQuantity={(quantity) =>
                    updateQuantity(item.id, quantity)
                  }
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>

          {/* Resumen y checkout */}
          <View style={styles.summaryContainer}>
            <CartSummary
              subtotal={selectedTotal}
              selectedCount={selectedCount}
              onCheckout={proceedToCheckout}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: 20,
  },
  bottomSpace: {
    height: 120,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    padding: 20,
  },
});