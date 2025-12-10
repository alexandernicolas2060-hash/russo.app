import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';
import ProductGrid from '../components/product/ProductGrid';
import FilterModal from '../components/product/FilterModal';

// Services
import { RussoAPI } from '../services/RussoAPI';

export default function AllProductsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });

  useEffect(() => {
    loadProducts(true);
  }, [filters]);

  const loadProducts = async (reset = false) => {
    if ((loading || refreshing) && !reset) return;
    
    const currentPage = reset ? 1 : page;
    
    try {
      reset ? setLoading(true) : setRefreshing(true);
      
      const response = await RussoAPI.getProducts({
        ...filters,
        page: currentPage,
        limit: 20,
      });
      
      if (reset) {
        setProducts(response.products || []);
      } else {
        setProducts([...products, ...(response.products || [])]);
      }
      
      setHasMore(response.pagination?.hasMore || false);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error loading products:', error);
      RussoToast.show('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProducts();
    }
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleFilterReset = () => {
    setFilters({
      category: '',
      gender: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
    });
    setShowFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.gender) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.sort !== 'newest') count++;
    return count;
  };

  const HeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={[styles.filterButton, getActiveFilterCount() > 0 && styles.filterButtonActive]}
        onPress={() => setShowFilters(true)}
      >
        <Icon name="filter-variant" size={24} color="#F5F5F5" />
        {getActiveFilterCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>No hay más productos</Text>
        </View>
      );
    }
    
    if (loading && !refreshing) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#D4AF37" />
        </View>
      );
    }
    
    return null;
  };

  if (loading && !refreshing) {
    return <RussoLoader />;
  }

  return (
    <View style={styles.container}>
      <RussoHeader 
        title="Todos los Productos" 
        showBack={true}
        right={<HeaderRight />}
      />

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="package-variant" size={100} color="#2C2C2C" />
          <Text style={styles.emptyTitle}>No hay productos</Text>
          <Text style={styles.emptySubtitle}>
            {getActiveFilterCount() > 0
              ? 'Prueba con otros filtros'
              : 'Pronto agregaremos más productos exclusivos'}
          </Text>
          {getActiveFilterCount() > 0 && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleFilterReset}
            >
              <Text style={styles.emptyButtonText}>LIMPIAR FILTROS</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <ProductGrid
                products={[item]}
                onProductPress={(product) =>
                  navigation.navigate('ProductDetail', {
                    productId: product.id,
                  })
                }
                numColumns={2}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.secondary}
              colors={[theme.colors.secondary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 5,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    padding: 5,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4757',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#F5F5F5',
    fontSize: 10,
    fontFamily: 'Geist-Bold',
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
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
  listContent: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productItem: {
    width: '48%',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
});