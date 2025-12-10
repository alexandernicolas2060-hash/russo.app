import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoProductCard } from '../components/RussoProductCard';
import { RussoLoader } from '../components/RussoLoader';
import ProductGrid from '../components/product/ProductGrid';
import WidgetGrid from '../components/widgets/WidgetGrid';
import { RussoToast } from '../components/common/RussoToast';

// Services
import { RussoAPI } from '../services/RussoAPI';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar producto destacado
      const featured = await RussoAPI.getFeaturedProduct();
      setFeaturedProduct(featured);
      
      // Cargar productos recientes
      const recent = await RussoAPI.getProducts({
        page: 1,
        limit: 20,
        sort: 'newest'
      });
      setProducts(recent);
      
    } catch (error) {
      console.error('Error loading home data:', error);
      RussoToast.show('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading && !refreshing) {
    return <RussoLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Header animado */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <RussoHeader 
          title="Russo"
          showCart={true}
          showMenu={true}
        />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.secondary}
            colors={[theme.colors.secondary]}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Widgets personalizados */}
        <WidgetGrid />

        {/* Producto destacado */}
        {featuredProduct && (
          <View style={styles.featuredContainer}>
            <RussoProductCard
              product={featuredProduct}
              featured={true}
              onPress={() => navigation.navigate('ProductDetail', { 
                productId: featuredProduct.id 
              })}
            />
          </View>
        )}

        {/* Grid de productos */}
        <View style={styles.productsContainer}>
          <ProductGrid
            products={products}
            onProductPress={(product) => 
              navigation.navigate('ProductDetail', { 
                productId: product.id 
              })
            }
          />
        </View>

        {/* Espacio final */}
        <View style={styles.bottomSpace} />
      </ScrollView>
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
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0A0A0A',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  featuredContainer: {
    marginTop: 100,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  productsContainer: {
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  bottomSpace: {
    height: 100,
  },
});