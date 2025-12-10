import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import { RussoProductCard } from '../components/RussoProductCard';
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';

// Services
import { RussoAPI } from '../services/RussoAPI';

export default function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([
    'Reloj de lujo',
    'Bolso exclusivo',
    'Joyas premium',
    'Tecnología avanzada',
    'Moda italiana',
    'Perfumes exclusivos',
    'Accesorios deportivos',
    'Hogar inteligente',
  ]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Focus search input on mount
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // Load recent searches
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // TODO: Load from AsyncStorage
      const recent = await AsyncStorage.getItem('@russo_recent_searches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);

    try {
      await AsyncStorage.setItem('@russo_recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      const results = await RussoAPI.searchProducts(query);
      setSearchResults(results);
      saveRecentSearch(query);
    } catch (error) {
      console.error('Search error:', error);
      RussoToast.show('Error en la búsqueda', 'error');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const SearchHeader = () => (
    <View style={styles.searchHeader}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <View style={styles.searchInputContainer}>
        <Icon name="magnify" size={20} color="#888888" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar productos exclusivos..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close-circle" size={20} color="#888888" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSearchSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {recentSearches.length > 0 && (
        <View style={styles.suggestionSection}>
          <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
          <View style={styles.suggestionsGrid}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => {
                  setSearchQuery(search);
                  handleSearch(search);
                }}
              >
                <Icon name="history" size={16} color="#888888" />
                <Text style={styles.suggestionText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.suggestionSection}>
        <Text style={styles.sectionTitle}>Populares</Text>
        <View style={styles.suggestionsGrid}>
          {popularSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => {
                setSearchQuery(search);
                handleSearch(search);
              }}
            >
              <Icon name="trending-up" size={16} color="#D4AF37" />
              <Text style={styles.suggestionText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categorías populares */}
      <View style={styles.suggestionSection}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.categoriesGrid}>
          {[
            { icon: 'watch', label: 'Relojes', color: '#FF6B6B' },
            { icon: 'bag-personal', label: 'Bolsos', color: '#4ECDC4' },
            { icon: 'diamond-stone', label: 'Joyas', color: '#FFD93D' },
            { icon: 'cellphone', label: 'Tecnología', color: '#6BCF7F' },
            { icon: 'tshirt-crew', label: 'Moda', color: '#A78BFA' },
            { icon: 'home', label: 'Hogar', color: '#FF9F43' },
          ].map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => {
                setSearchQuery(category.label);
                handleSearch(category.label);
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Icon name={category.icon} size={24} color="#0A0A0A" />
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Icon name="file-search-outline" size={80} color="#2C2C2C" />
          <Text style={styles.noResultsTitle}>No se encontraron resultados</Text>
          <Text style={styles.noResultsSubtitle}>
            Intenta con otras palabras clave o explora nuestras categorías
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <RussoProductCard
              product={item}
              onPress={() => handleProductPress(item)}
              compact
            />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.resultsGrid}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SearchHeader />
      
      {showResults ? (
        renderSearchResults()
      ) : (
        renderSearchSuggestions()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 50,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  suggestionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 15,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    padding: 20,
  },
  resultsGrid: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  resultItem: {
    width: '48%',
  },
});