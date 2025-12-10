import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RussoHeader = ({
  title = 'Russo',
  showBack = false,
  showMenu = false,
  showCart = false,
  right,
  transparent = false,
  onCartPress,
}) => {
  const navigation = useNavigation();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleMenuPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.openDrawer();
  };

  const handleCartPress = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      navigation.navigate('Cart');
    }
  };

  return (
    <View style={[
      styles.container,
      transparent && styles.containerTransparent,
    ]}>
      {/* Left section */}
      <View style={styles.leftSection}>
        {showMenu && (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Icon name="menu" size={28} color="#F5F5F5" />
            </Animated.View>
          </TouchableOpacity>
        )}
        
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={28} color="#F5F5F5" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center section - Logo/Title */}
      <View style={styles.centerSection}>
        {title === 'Russo' ? (
          <View style={styles.logoContainer}>
            <View style={styles.logoR}>
              <View style={styles.logoRVertical} />
              <View style={styles.logoRDiagonal} />
              <View style={styles.logoRCurve} />
            </View>
            <Text style={styles.logoText}>USSO</Text>
          </View>
        ) : (
          <Text style={styles.titleText}>{title}</Text>
        )}
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        {right ? (
          right
        ) : (
          <>
            {showCart && (
              <TouchableOpacity
                onPress={handleCartPress}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Icon name="shopping" size={28} color="#F5F5F5" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  containerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 50,
  },
  iconButton: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoR: {
    width: 30,
    height: 40,
    position: 'relative',
    marginRight: 5,
  },
  logoRVertical: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 40,
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  logoRDiagonal: {
    position: 'absolute',
    left: 4,
    top: 10,
    width: 12,
    height: 6,
    backgroundColor: '#D4AF37',
    borderRadius: 3,
    transform: [{ rotate: '-30deg' }],
  },
  logoRCurve: {
    position: 'absolute',
    left: 5,
    top: 18,
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 7.5,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
  titleText: {
    fontSize: 20,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
});