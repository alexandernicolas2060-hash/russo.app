import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RussoProductCard = ({
  product,
  onPress,
  featured = false,
  compact = false,
  style,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
    // TODO: Toggle favorite in backend
  };

  const mainImage = product.images?.[0]?.url || product.image;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[
        styles.container,
        featured && styles.featuredContainer,
        compact && styles.compactContainer,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          featured && styles.featuredCard,
          compact && styles.compactCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Image container */}
        <View style={[
          styles.imageContainer,
          featured && styles.featuredImageContainer,
          compact && styles.compactImageContainer,
        ]}>
          {mainImage ? (
            <Image
              source={{ uri: mainImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="image-off" size={40} color="#2C2C2C" />
            </View>
          )}

          {/* Favorite button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#FF4757' : '#F5F5F5'}
            />
          </TouchableOpacity>

          {/* Featured badge */}
          {product.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>DESTACADO</Text>
            </View>
          )}

          {/* 3D badge */}
          {product.model3d && (
            <View style={styles.model3dBadge}>
              <Icon name="cube" size={12} color="#0A0A0A" />
            </View>
          )}
        </View>

        {/* Info container */}
        <View style={[
          styles.infoContainer,
          compact && styles.compactInfoContainer,
        ]}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.category,
                compact && styles.compactCategory,
              ]}
              numberOfLines={1}
            >
              {product.category || 'Producto'}
            </Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={12} color="#D4AF37" />
              <Text style={styles.ratingText}>
                {product.rating || '5.0'}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.name,
              featured && styles.featuredName,
              compact && styles.compactName,
            ]}
            numberOfLines={featured ? 2 : 1}
          >
            {product.name}
          </Text>

          {!compact && product.description && (
            <Text
              style={styles.description}
              numberOfLines={2}
            >
              {product.description}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={[
              styles.price,
              featured && styles.featuredPrice,
            ]}>
              ${parseFloat(product.price || 0).toFixed(2)}
            </Text>
            
            <View style={styles.stockContainer}>
              {product.stock > 0 ? (
                <>
                  <View style={styles.stockDot} />
                  <Text style={styles.stockText}>
                    {product.stock} disponibles
                  </Text>
                </>
              ) : (
                <Text style={styles.outOfStock}>AGOTADO</Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  featuredContainer: {
    marginBottom: 25,
  },
  compactContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  featuredCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  compactCard: {
    borderRadius: 12,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  featuredImageContainer: {
    height: 300,
  },
  compactImageContainer: {
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: '#0A0A0A',
    fontSize: 10,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  model3dBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: 15,
  },
  compactInfoContainer: {
    padding: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#888888',
    letterSpacing: 1,
  },
  compactCategory: {
    fontSize: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#D4AF37',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 8,
    lineHeight: 24,
  },
  featuredName: {
    fontSize: 24,
    lineHeight: 32,
  },
  compactName: {
    fontSize: 14,
    lineHeight: 18,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
  },
  featuredPrice: {
    fontSize: 28,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
  },
  stockText: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  outOfStock: {
    fontSize: 12,
    fontFamily: 'Geist-Bold',
    color: '#FF4757',
    letterSpacing: 1,
  },
});