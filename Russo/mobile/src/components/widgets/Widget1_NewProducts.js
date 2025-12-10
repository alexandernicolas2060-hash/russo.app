import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { russoApi } from '../../services/api/russoApi';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const WIDGET_HEIGHT = 200;

export default function WidgetNewProducts({ config = {} }) {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = new Animated.Value(0);
  
  useEffect(() => {
    loadNewProducts();
    
    // Auto-rotación cada 5 segundos
    const interval = setInterval(() => {
      if (products.length > 1) {
        setCurrentIndex(prev => (prev + 1) % products.length);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [products.length]);
  
  const loadNewProducts = async () => {
    try {
      const limit = config.limit || 5;
      const data = await russoApi.products.getLatest(limit);
      setProducts(data.products || data);
    } catch (error) {
      console.error('Error loading new products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };
  
  const renderProduct = (product, index) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp'
    });
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp'
    });
    
    return (
      <Animated.View
        key={product.id}
        style={[
          styles.productCard,
          {
            transform: [{ scale }],
            opacity
          }
        ]}
      >
        <TouchableOpacity
          style={styles.productTouchable}
          onPress={() => handleProductPress(product)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={theme === 'dark' 
              ? ['rgba(26, 26, 26, 0.9)', 'rgba(10, 10, 10, 0.95)'] 
              : ['rgba(255, 255, 255, 0.9)', 'rgba(245, 245, 245, 0.95)']}
            style={styles.productGradient}
          >
            {/* Badge "Nuevo" */}
            <View style={styles.newBadge}>
              <LinearGradient
                colors={[colors.secondary, '#F7EF8A', colors.secondary]}
                style={styles.newBadgeGradient}
              >
                <Animated.Text style={styles.newBadgeText}>
                  NUEVO
                </Animated.Text>
              </LinearGradient>
            </View>
            
            {/* Imagen del producto */}
            <View style={styles.productImageContainer}>
              {product.main_image_url ? (
                <Image
                  source={{ uri: product.main_image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImagePlaceholder, { backgroundColor: colors.accent }]} />
              )}
            </View>
            
            {/* Información del producto */}
            <View style={styles.productInfo}>
              <Animated.Text 
                style={[styles.productName, { color: colors.text }]}
                numberOfLines={1}
              >
                {product.name}
              </Animated.Text>
              
              <View style={styles.productDetails}>
                <Animated.Text style={[styles.productPrice, { color: colors.secondary }]}>
                  ${product.price.toFixed(2)}
                </Animated.Text>
                
                {product.compare_price && (
                  <Animated.Text style={[styles.productComparePrice, { color: colors.textSecondary }]}>
                    ${product.compare_price.toFixed(2)}
                  </Animated.Text>
                )}
              </View>
              
              {/* Indicador de disponibilidad */}
              <View style={styles.availabilityContainer}>
                <View style={[
                  styles.availabilityDot,
                  { 
                    backgroundColor: product.stock_quantity > 0 
                      ? colors.success 
                      : colors.error 
                  }
                ]} />
                <Animated.Text style={[styles.availabilityText, { color: colors.textSecondary }]}>
                  {product.stock_quantity > 0 
                    ? `Disponible (${product.stock_quantity})` 
                    : 'Agotado'}
                </Animated.Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={theme === 'dark' 
            ? ['rgba(26, 26, 26, 0.5)', 'rgba(10, 10, 10, 0.7)'] 
            : ['rgba(255, 255, 255, 0.5)', 'rgba(245, 245, 245, 0.7)']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <View style={[styles.loadingSpinner, { borderColor: colors.secondary }]} />
            <Animated.Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando novedades...
            </Animated.Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
  
  if (products.length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Cabecera del widget */}
      <View style={styles.widgetHeader}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.secondary, 'transparent']}
            style={styles.headerLine}
          />
          <Animated.Text style={[styles.widgetTitle, { color: colors.text }]}>
            NUEVAS EXCLUSIVIDADES
          </Animated.Text>
          <LinearGradient
            colors={['transparent', colors.secondary]}
            style={styles.headerLine}
          />
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('AllProducts')}>
          <Animated.Text style={[styles.viewAll, { color: colors.textSecondary }]}>
            Ver todos
          </Animated.Text>
        </TouchableOpacity>
      </View>
      
      {/* Carrusel de productos */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {products.map((product, index) => renderProduct(product, index))}
        </ScrollView>
        
        {/* Indicadores de página */}
        <View style={styles.pagination}>
          {products.map((_, index) => {
            const inputRange = [
              (index - 0.5) * width,
              index * width,
              (index + 0.5) * width
            ];
            
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: 'clamp'
            });
            
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp'
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: colors.secondary
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
      
      {/* Fondo decorativo */}
      <LinearGradient
        colors={['transparent', 'rgba(212, 175, 55, 0.05)']}
        style={styles.decorativeBackground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WIDGET_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerLine: {
    width: 20,
    height: 1
  },
  widgetTitle: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2
  },
  viewAll: {
    fontFamily: 'ElegantSans',
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.7
  },
  carouselContainer: {
    flex: 1
  },
  productCard: {
    width: width - 80,
    height: 120,
    marginHorizontal: 8
  },
  productTouchable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden'
  },
  productGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: 12
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10
  },
  newBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  newBadgeText: {
    fontFamily: 'ElegantSans',
    fontSize: 9,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 1
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  productImagePlaceholder: {
    flex: 1,
    borderRadius: 12
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between'
  },
  productName: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  productPrice: {
    fontFamily: 'ElegantSans',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  productComparePrice: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.6
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  availabilityText: {
    fontFamily: 'ElegantSans',
    fontSize: 10,
    letterSpacing: 0.5
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12
  },
  paginationDot: {
    height: 4,
    borderRadius: 2
  },
  decorativeBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: -1
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContent: {
    alignItems: 'center',
    gap: 12
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderTopColor: 'transparent'
  },
  loadingText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    letterSpacing: 1
  }
});
