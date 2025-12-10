import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RussoAPI from '../services/RussoAPI';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await RussoAPI.getProducts();
      if (response.success) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderProductCard = (product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('Product', { product })}
    >
      <View style={styles.productImage}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <Icon name="image" size={50} color="rgba(255,255,255,0.2)" />
        )}
        {product.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>DESTACADO</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        {product.stock < 5 && product.stock > 0 && (
          <Text style={styles.stock}>Solo {product.stock} disponibles</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RUSSO</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={24} color="#FFF" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Icon name="cart" size={24} color="#FFF" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar}>
        <Icon name="magnify" size={20} color="rgba(255,255,255,0.5)" />
        <Text style={styles.searchText}>Buscar productos exclusivos...</Text>
      </TouchableOpacity>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFF"
          />
        }
      >
        {/* Featured Products */}
        <Text style={styles.sectionTitle}>Productos Destacados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {products
            .filter(p => p.is_featured)
            .map(renderProductCard)}
        </ScrollView>

        {/* All Products */}
        <Text style={styles.sectionTitle}>Todos los Productos</Text>
        <View style={styles.productsGrid}>
          {products.map(renderProductCard)}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="home" size={24} color="#FFF" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="shopping" size={24} color="rgba(255,255,255,0.5)" />
          <Text style={[styles.navText, styles.navTextInactive]}>Comprar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="heart" size={24} color="rgba(255,255,255,0.5)" />
          <Text style={[styles.navText, styles.navTextInactive]}>Favoritos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Auth')}>
          <Icon name="account" size={24} color="rgba(255,255,255,0.5)" />
          <Text style={[styles.navText, styles.navTextInactive]}>Cuenta</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  searchText: {
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  productCard: {
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginHorizontal: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  category: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 4,
  },
  name: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stock: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  navTextInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
});

export default HomeScreen;
