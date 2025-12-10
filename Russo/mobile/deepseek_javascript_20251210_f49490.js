import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';
import { RussoModal } from '../components/common/RussoModal';
import ProductDetail from '../components/product/ProductDetail';

// Services
import { RussoAPI } from '../services/RussoAPI';
import { RussoCart } from '../services/RussoCart';

// 3D Viewer
import Product3DViewer from '../components/product/Product3DViewer';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await RussoAPI.getProduct(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      RussoToast.show('Error al cargar el producto', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await RussoCart.addItem(productId, quantity);
      RussoToast.show('Producto agregado al carrito', 'success');
    } catch (error) {
      RussoToast.show('Error al agregar al carrito', 'error');
    }
  };

  const buyNow = async () => {
    await addToCart();
    navigation.navigate('Checkout');
  };

  const shareProduct = async () => {
    try {
      await Share.share({
        title: product.name,
        message: `Mira este producto en Russo: ${product.name} - ${product.price}`,
        url: `russo://product/${productId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await RussoAPI.toggleFavorite(productId);
      RussoToast.show(
        product.isFavorite
          ? 'Eliminado de favoritos'
          : 'Agregado a favoritos',
        'success'
      );
      setProduct({
        ...product,
        isFavorite: !product.isFavorite,
      });
    } catch (error) {
      RussoToast.show('Error al actualizar favoritos', 'error');
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return <RussoLoader />;
  }

  if (!product) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header animado */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Animated.Text
          style={[
            styles.headerTitle,
            {
              opacity: headerOpacity,
              color: theme.colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {product.name}
        </Animated.Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={toggleFavorite}
          >
            <Icon
              name={product.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={product.isFavorite ? '#FF4757' : theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={shareProduct}>
            <Icon name="share-variant" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={() => setShow3DViewer(true)}
            activeOpacity={0.9}
          >
            <Animated.Image
              source={{ uri: product.images[selectedImage]?.url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            
            {/* Botón 3D */}
            {product.model3d && (
              <View style={styles.view3dButton}>
                <Icon name="cube-scan" size={20} color="#0A0A0A" />
                <Text style={styles.view3dText}>VER EN 3D</Text>
              </View>
            )}

            {/* Selector de imágenes */}
            <View style={styles.imageSelector}>
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.imageDot,
                    selectedImage === index && styles.imageDotActive,
                  ]}
                  onPress={() => setSelectedImage(index)}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Información del producto */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>
              ${parseFloat(product.price).toFixed(2)}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#D4AF37" />
            <Text style={styles.ratingText}>
              {product.rating} ({product.reviewsCount} reseñas)
            </Text>
          </View>

          <Text style={styles.productDescription}>
            {product.description}
          </Text>

          {/* Especificaciones */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <View style={styles.specsContainer}>
              <Text style={styles.specsTitle}>Especificaciones</Text>
              {Object.entries(product.specs).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}:</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Selector de cantidad */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Icon name="minus" size={20} color="#F5F5F5" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
                disabled={quantity >= product.stock}
              >
                <Icon name="plus" size={20} color="#F5F5F5" />
              </TouchableOpacity>
            </View>
            <Text style={styles.stockText}>
              {product.stock > 0
                ? `${product.stock} disponibles`
                : 'Agotado'}
            </Text>
          </View>
        </View>

        {/* Espacio para botones flotantes */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Botones flotantes */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.cartButton]}
          onPress={addToCart}
          disabled={product.stock === 0}
        >
          <Icon name="cart-plus" size={24} color="#0A0A0A" />
          <Text style={styles.cartButtonText}>AGREGAR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingButton, styles.buyButton]}
          onPress={buyNow}
          disabled={product.stock === 0}
        >
          <Text style={styles.buyButtonText}>COMPRAR AHORA</Text>
        </TouchableOpacity>
      </View>

      {/* Modal 3D Viewer */}
      <RussoModal
        visible={show3DViewer}
        onClose={() => setShow3DViewer(false)}
        fullScreen
      >
        {product.model3d && (
          <Product3DViewer
            modelUrl={product.model3d}
            onClose={() => setShow3DViewer(false)}
          />
        )}
      </RussoModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    marginLeft: 15,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 5,
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.9,
    position: 'relative',
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  view3dButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  view3dText: {
    color: '#0A0A0A',
    fontSize: 12,
    fontFamily: 'Geist-Bold',
    letterSpacing: 0.5,
  },
  imageSelector: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageDotActive: {
    backgroundColor: '#D4AF37',
    width: 20,
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productName: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    marginRight: 10,
  },
  productPrice: {
    fontSize: 28,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 5,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#888888',
  },
  productDescription: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 30,
  },
  specsContainer: {
    marginBottom: 30,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
  },
  specsTitle: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 15,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  specKey: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  specValue: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    color: '#F5F5F5',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    color: '#F5F5F5',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    minWidth: 30,
    textAlign: 'center',
  },
  stockText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  bottomSpace: {
    height: 120,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  floatingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  cartButton: {
    backgroundColor: '#2C2C2C',
  },
  cartButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    letterSpacing: 0.5,
  },
  buyButton: {
    backgroundColor: '#D4AF37',
  },
  buyButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
});