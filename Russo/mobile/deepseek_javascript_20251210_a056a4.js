import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';
import { RussoModal } from '../components/common/RussoModal';
import CartSummary from '../components/cart/CartSummary';

// Services
import { RussoAPI } from '../services/RussoAPI';
import { RussoOrders } from '../services/RussoOrders';

export default function CheckoutScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { items } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar direcciones
      const userAddresses = await RussoAPI.getUserAddresses();
      setAddresses(userAddresses);
      
      if (userAddresses.length > 0) {
        setSelectedAddress(userAddresses[0]);
      }

      // Cargar métodos de pago
      const methods = await RussoAPI.getPaymentMethods();
      setPaymentMethods(methods);
      
      if (methods.length > 0) {
        setSelectedPayment(methods[0]);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      RussoToast.show('Error al cargar datos de pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
      };
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 1000 ? 0 : 50; // Envío gratis sobre $1000
    const tax = subtotal * 0.16; // 16% de impuesto
    const total = subtotal + shipping + tax;

    return {
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      RussoToast.show('Selecciona una dirección de envío', 'error');
      return;
    }

    if (!selectedPayment) {
      RussoToast.show('Selecciona un método de pago', 'error');
      return;
    }

    Alert.alert(
      'Confirmar pedido',
      `¿Confirmar compra por $${calculateTotals().total}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            await processOrder();
          },
        },
      ]
    );
  };

  const processOrder = async () => {
    try {
      setProcessing(true);

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayment.id,
        notes: orderNotes,
        totals: calculateTotals(),
      };

      const result = await RussoOrders.createOrder(orderData);

      if (result.success) {
        RussoToast.show('¡Pedido realizado con éxito!', 'success');
        
        // Navegar a confirmación
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Home' },
            { 
              name: 'OrderConfirmation', 
              params: { orderId: result.orderId } 
            },
          ],
        });
      }
    } catch (error) {
      console.error('Order error:', error);
      RussoToast.show('Error al procesar el pedido', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const AddressItem = ({ address, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.addressItem, selected && styles.addressItemSelected]}
      onPress={onSelect}
    >
      <View style={styles.addressIcon}>
        <Icon name="map-marker" size={24} color="#D4AF37" />
      </View>
      <View style={styles.addressInfo}>
        <Text style={styles.addressTitle}>{address.name}</Text>
        <Text style={styles.addressText}>{address.street}</Text>
        <Text style={styles.addressText}>
          {address.city}, {address.state} {address.zipCode}
        </Text>
        <Text style={styles.addressText}>{address.country}</Text>
        <Text style={styles.addressPhone}>📱 {address.phone}</Text>
      </View>
      {selected && (
        <Icon name="check-circle" size={24} color="#D4AF37" />
      )}
    </TouchableOpacity>
  );

  const PaymentMethodItem = ({ method, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.paymentItem, selected && styles.paymentItemSelected]}
      onPress={onSelect}
    >
      <View style={styles.paymentIcon}>
        <Icon name={method.icon} size={24} color="#D4AF37" />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{method.name}</Text>
        <Text style={styles.paymentDescription}>{method.description}</Text>
        {method.lastFour && (
          <Text style={styles.paymentDetails}>•••• {method.lastFour}</Text>
        )}
      </View>
      {selected && (
        <Icon name="check-circle" size={24} color="#D4AF37" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <RussoLoader />;
  }

  const totals = calculateTotals();

  return (
    <View style={styles.container}>
      <RussoHeader title="Finalizar compra" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen del pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DEL PEDIDO</Text>
          <View style={styles.orderSummary}>
            {items?.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemLeft}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemQuantity}>
                    Cantidad: {item.quantity}
                  </Text>
                </View>
                <Text style={styles.orderItemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dirección de envío */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DIRECCIÓN DE ENVÍO</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)}>
              <Text style={styles.sectionAction}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          
          {selectedAddress ? (
            <View style={styles.selectedAddress}>
              <Icon name="map-marker" size={20} color="#D4AF37" />
              <View style={styles.selectedAddressInfo}>
                <Text style={styles.selectedAddressName}>
                  {selectedAddress.name}
                </Text>
                <Text style={styles.selectedAddressText}>
                  {selectedAddress.street}, {selectedAddress.city}
                </Text>
                <Text style={styles.selectedAddressText}>
                  {selectedAddress.phone}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => setShowAddressModal(true)}
            >
              <Icon name="plus" size={24} color="#D4AF37" />
              <Text style={styles.addAddressText}>Agregar dirección</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Método de pago */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MÉTODO DE PAGO</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.sectionAction}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          
          {selectedPayment ? (
            <View style={styles.selectedPayment}>
              <Icon name={selectedPayment.icon} size={20} color="#D4AF37" />
              <View style={styles.selectedPaymentInfo}>
                <Text style={styles.selectedPaymentName}>
                  {selectedPayment.name}
                </Text>
                {selectedPayment.lastFour && (
                  <Text style={styles.selectedPaymentText}>
                    •••• {selectedPayment.lastFour}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Icon name="plus" size={24} color="#D4AF37" />
              <Text style={styles.addPaymentText}>Agregar método de pago</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notas del pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTAS DEL PEDIDO (OPCIONAL)</Text>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Instrucciones especiales para la entrega..."
              placeholderTextColor="#666666"
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Resumen de costos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DE COSTOS</Text>
          <View style={styles.costSummary}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Subtotal</Text>
              <Text style={styles.costValue}>${totals.subtotal}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Envío</Text>
              <Text style={styles.costValue}>
                {parseFloat(totals.shipping) === 0 ? 'GRATIS' : `$${totals.shipping}`}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Impuestos (16%)</Text>
              <Text style={styles.costValue}>${totals.tax}</Text>
            </View>
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totals.total}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Botón de pago */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            processing && styles.paymentButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Icon name="lock" size={20} color="#0A0A0A" />
              <Text style={styles.paymentButtonText}>
                PAGAR ${totals.total}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.paymentDisclaimer}>
          Al realizar el pago, aceptas nuestros Términos de Servicio
        </Text>
      </View>

      {/* Modal de direcciones */}
      <RussoModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Seleccionar dirección"
      >
        <ScrollView style={styles.modalContent}>
          {addresses.map((address) => (
            <AddressItem
              key={address.id}
              address={address}
              selected={selectedAddress?.id === address.id}
              onSelect={() => {
                setSelectedAddress(address);
                setShowAddressModal(false);
              }}
            />
          ))}
          
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => {
              setShowAddressModal(false);
              navigation.navigate('AddAddress');
            }}
          >
            <Icon name="plus-circle" size={24} color="#D4AF37" />
            <Text style={styles.addNewText}>Agregar nueva dirección</Text>
          </TouchableOpacity>
        </ScrollView>
      </RussoModal>

      {/* Modal de métodos de pago */}
      <RussoModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Seleccionar método de pago"
      >
        <ScrollView style={styles.modalContent}>
          {paymentMethods.map((method) => (
            <PaymentMethodItem
              key={method.id}
              method={method}
              selected={selectedPayment?.id === method.id}
              onSelect={() => {
                setSelectedPayment(method);
                setShowPaymentModal(false);
              }}
            />
          ))}
          
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => {
              setShowPaymentModal(false);
              navigation.navigate('AddPaymentMethod');
            }}
          >
            <Icon name="plus-circle" size={24} color="#D4AF37} />
            <Text style={styles.addNewText}>Agregar nuevo método de pago</Text>
          </TouchableOpacity>
        </ScrollView>
      </RussoModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    color: '#D4AF37',
  },
  orderSummary: {
    marginTop: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  orderItemLeft: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  orderItemPrice: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
  },
  selectedAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  selectedAddressInfo: {
    flex: 1,
  },
  selectedAddressName: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  selectedAddressText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#2C2C2C',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addAddressText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
  },
  selectedPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  selectedPaymentInfo: {
    flex: 1,
  },
  selectedPaymentName: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  selectedPaymentText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#2C2C2C',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addPaymentText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
  },
  notesContainer: {
    marginTop: 10,
  },
  notesInput: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 15,
    color: '#F5F5F5',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    minHeight: 100,
  },
  costSummary: {
    marginTop: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  costLabel: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
  },
  costValue: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 15,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
  },
  bottomSpace: {
    height: 120,
  },
  paymentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    padding: 20,
  },
  paymentButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  paymentButtonDisabled: {
    opacity: 0.7,
  },
  paymentButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  paymentDisclaimer: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  modalContent: {
    maxHeight: 400,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
    gap: 15,
  },
  addressItemSelected: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
    marginTop: 5,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
    gap: 15,
  },
  paymentItemSelected: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
  },
  paymentDetails: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#888888',
    marginTop: 5,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#2C2C2C',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 15,
  },
  addNewText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
  },
});