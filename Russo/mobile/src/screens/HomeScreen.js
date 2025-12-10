import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

// Componentes
import RussoHeader from '../components/common/RussoHeader';
import Product3DViewer from '../components/product/Product3DViewer';
import ProductGrid from '../components/product/ProductGrid';
import RussoLoader from '../components/common/RussoLoader';
import WidgetGrid from '../components/widgets/WidgetGrid';

// Servicios
import { getLatestProducts, getFeaturedProduct } from '../services/api/productService';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animaciones
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const featuredScale = scrollY.interpolate({
    inputRange: [-height * 0.3, 0, height * 0.1],
    outputRange: [1.5, 1, 0.9],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const [featured, latest] = await Promise.all([
        getFeaturedProduct(),
        getLatestProducts(20)
      ]);
      
      setFeaturedProduct(featured);
      setLatestProducts(latest);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  const handleMenuPress = () => {
    navigation.navigate('Menu');
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  if (loading && !refreshing) {
    return <RussoLoader message="Cargando exclusividades..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fondo degradado elegante */}
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#0A0A0A', '#1A1A1A', '#0A0A0A'] 
          : ['#F5F5F5', '#FFFFFF', '#F5F5F5']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Cabecera fija con desvanecimiento */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <BlurView intensity={90} tint={theme} style={styles.blurHeader}>
          <RussoHeader
            onCartPress={handleCartPress}
            onMenuPress={handleMenuPress}
            onSearchPress={handleSearchPress}
          />
        </BlurView>
      </Animated.View>
      
      {/* Scroll principal */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
            progressBackgroundColor={colors.surface}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Producto destacado con animación 3D */}
        {featuredProduct && (
          <Animated.View style={[styles.featuredSection, {
            transform: [{ scale: featuredScale }]
          }]}>
            <Product3DViewer
              product={featuredProduct}
              autoRotate={true}
              enableZoom={true}
              onPress={() => handleProductPress(featuredProduct)}
            />
            
            {/* Información del producto destacado */}
            <View style={styles.featuredInfo}>
              <LinearGradient
                colors={['transparent', 'rgba(10, 10, 10, 0.9)']}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredTextContainer}>
                  <View style={styles.badge}>
                    <View style={[styles.badgeDot, { backgroundColor: colors.secondary }]} />
                    <Animated.Text style={[styles.badgeText, { color: colors.text }]}>
                      NUEVO LANZAMIENTO
                    </Animated.Text>
                  </View>
                  
                  <Animated.Text 
                    style={[styles.featuredTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {featuredProduct.name}
                  </Animated.Text>
                  
                  <View style={styles.priceContainer}>
                    <Animated.Text style={[styles.price, { color: colors.secondary }]}>
                      ${featuredProduct.price.toFixed(2)}
                    </Animated.Text>
                    {featuredProduct.compare_price && (
                      <Animated.Text style={[styles.comparePrice, { color: colors.textSecondary }]}>
                        ${featuredProduct.compare_price.toFixed(2)}
                      </Animated.Text>
                    )}
                  </View>
                  
                  <Animated.Text 
                    style={[styles.featuredDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {featuredProduct.short_description}
                  </Animated.Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}
        
        {/* Separador elegante */}
        <View style={styles.separatorContainer}>
          <View style={[styles.separatorLine, { backgroundColor: colors.accent }]} />
          <View style={[styles.separatorDot, { backgroundColor: colors.secondary }]} />
          <View style={[styles.separatorLine, { backgroundColor: colors.accent }]} />
        </View>
        
        {/* Widgets personalizables */}
        <WidgetGrid userId={user?.id} />
        
        {/* Últimos productos */}
        <View style={styles.latestSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.titleLine, { backgroundColor: colors.secondary }]} />
              <Animated.Text style={[styles.sectionTitle, { color: colors.text }]}>
                ÚLTIMAS EXCLUSIVIDADES
              </Animated.Text>
              <View style={[styles.titleLine, { backgroundColor: colors.secondary }]} />
            </View>
            
            <Animated.Text 
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
              onPress={() => navigation.navigate('AllProducts')}
            >
              Ver todos
            </Animated.Text>
          </View>
          
          <ProductGrid
            products={latestProducts}
            onProductPress={handleProductPress}
            columns={2}
            style={styles.productGrid}
          />
        </View>
        
        {/* Espacio para el bottom tab bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      
      {/* Botón flotante de búsqueda */}
      <Animated.View 
        style={[
          styles.floatingSearch,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
              extrapolate: 'clamp'
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 50],
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}
      >
        <BlurView intensity={80} tint={theme} style={styles.searchBlur}>
          <Animated.Text 
            style={[styles.searchHint, { color: colors.textSecondary }]}
            onPress={handleSearchPress}
          >
            Buscar exclusividades...
          </Animated.Text>
        </BlurView>
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 30
  },
  blurHeader: {
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.7)'
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 30
  },
  featuredSection: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40
  },
  featuredGradient: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  featuredTextContainer: {
    gap: 12
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)'
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  badgeText: {
    fontFamily: 'ElegantSans',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600'
  },
  featuredTitle: {
    fontFamily: 'ElegantSerif',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  price: {
    fontFamily: 'ElegantSans',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1
  },
  comparePrice: {
    fontFamily: 'ElegantSans',
    fontSize: 18,
    textDecorationLine: 'line-through',
    opacity: 0.7
  },
  featuredDescription: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
    paddingHorizontal: 40
  },
  separatorLine: {
    flex: 1,
    height: 1,
    opacity: 0.3
  },
  separatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 12
  },
  latestSection: {
    paddingHorizontal: 20,
    marginBottom: 40
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  titleLine: {
    width: 40,
    height: 1
  },
  sectionTitle: {
    fontFamily: 'ElegantSerif',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2
  },
  sectionSubtitle: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    letterSpacing: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(44, 44, 44, 0.3)'
  },
  productGrid: {
    marginTop: 12
  },
  floatingSearch: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 100
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  searchHint: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 0.7
  }
});
