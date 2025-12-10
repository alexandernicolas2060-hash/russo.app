import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RussoAPI from '../services/RussoAPI';

const CartScreen = ({ navigation }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await RussoAPI.getCart();
      if (response.success) {
        setCart(response.cart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      if (newQuantity === 0) {
        await RussoAPI.removeFromCart(productId);
      } else {
        await RussoAPI.updateCartItem(productId, newQuantity);
      }
      await loadCart();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el carrito');
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos al carrito primero');
      return;
    }

    Alert.alert(
      'Finalizar Compra',
      `Total: $${cart.total?.toFixed(2) || '0.00'}\n\n¿Deseas proceder al pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar', 
          onPress: () => {
            Alert.alert(
              'Pago',
              'Esta función estará disponible pronto.\n\nPor ahora, contacta directamente para completar tu compra.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const renderCartItem = (item) => (
    <View key={item.product_id} style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price?.toFixed(2)} c/u</Text>
      </View>
      
      <View style={styles.itemControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, (item.quantity || 1) - 1)}
        >
          <Icon name="minus" size={20} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity || 1}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, (item.quantity || 1) + 1)}
        >
          <Icon name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => updateQuantity(item.product_id, 0)}
        >
          <Icon name="trash-can" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.itemTotal}>
        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cart-off" size={80} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyTitle}>Carrito Vacío</Text>
        <Text style={styles.emptyText}>
          Agrega productos exclusivos a tu carrito
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopButtonText}>Ir a Comprar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carrito</Text>
        <TouchableOpacity onPress={loadCart}>
          <Icon name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {cart.items.map(renderCartItem)}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            ${cart.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Envío</Text>
          <Text style={styles.summaryValue}>$0.00</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${cart.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Vaciar Carrito',
              '¿Estás seguro de vaciar todo el carrito?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Vaciar', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await RussoAPI.clearCart();
                      setCart({ ...cart, items: [] });
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo vaciar el carrito');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Icon name="trash-can-outline" size={20} color="#FF3B30" />
          <Text style={styles.clearButtonText}>Vaciar Todo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Icon name="shopping" size={24} color="#000" />
          <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  shopButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  itemInfo: {
    marginBottom: 15,
  },
  itemName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemPrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  itemTotal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 16,
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    gap: 10,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFF',
    gap: 10,
  },
  checkoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
