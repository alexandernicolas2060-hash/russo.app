import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RussoAPI from '../services/RussoAPI';

const ProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      const response = await RussoAPI.addToCart(product.id, quantity);
      
      if (response.success) {
        Alert.alert(
          '✅ Añadido al Carrito',
          `${product.name} se añadió a tu carrito.`,
          [
            { text: 'Seguir Comprando', style: 'cancel' },
            { 
              text: 'Ver Carrito', 
              onPress: () => navigation.navigate('Cart')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir al carrito');
    }
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Comprar Ahora',
      'Esta función estará disponible pronto.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image" size={80} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        
        {product.is_featured && (
          <View style={styles.featuredTag}>
            <Icon name="star" size={16} color="#000" />
            <Text style={styles.featuredTagText}>DESTACADO</Text>
          </View>
        )}
        
        {product.is_exclusive && (
          <View style={styles.exclusiveTag}>
            <Icon name="crown" size={16} color="#000" />
            <Text style={styles.exclusiveTagText}>EXCLUSIVO</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {product.original_price && product.original_price > product.price && (
            <Text style={styles.originalPrice}>
              ${product.original_price.toFixed(2)}
            </Text>
          )}
        </View>
        
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{product.rating}/5.0</Text>
          </View>
        )}
        
        {/* Quantity Selector */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Cantidad:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Icon name="minus" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
              disabled={quantity >= (product.stock || 10)}
            >
              <Icon name="plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Stock Info */}
        {product.stock !== undefined && (
          <View style={styles.stockContainer}>
            <Icon 
              name={product.stock > 0 ? "check-circle" : "close-circle"} 
              size={16} 
              color={product.stock > 0 ? "#34C759" : "#FF3B30"} 
            />
            <Text style={[
              styles.stock,
              { color: product.stock > 0 ? "#34C759" : "#FF3B30" }
            ]}>
              {product.stock > 0 
                ? `${product.stock} disponibles` 
                : 'Agotado'}
            </Text>
          </View>
        )}
        
        {/* Description */}
        <Text style={styles.description}>{product.description}</Text>
        
        {/* Specifications */}
        {product.specifications && (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>Especificaciones</Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key}:</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cartButton]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Icon name="cart-plus" size={24} color="#000" />
          <Text style={styles.cartButtonText}>Añadir al Carrito</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton]}
          onPress={handleBuyNow}
          disabled={product.stock === 0}
        >
          <Icon name="shopping" size={24} color="#FFF" />
          <Text style={styles.buyButtonText}>Comprar Ahora</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  featuredTagText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exclusiveTag: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  exclusiveTagText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
  },
  category: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  name: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  price: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 5,
  },
  rating: {
    color: '#FFF',
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    color: '#FFF',
    fontSize: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 8,
  },
  stock: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  specsContainer: {
    marginBottom: 30,
  },
  specsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  specKey: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    width: 120,
  },
  specValue: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  actionContainer: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  cartButton: {
    backgroundColor: '#FFF',
  },
  cartButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductScreen;
