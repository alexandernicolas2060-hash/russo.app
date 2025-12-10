import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';

export const RussoLoader = ({ size = 'large', fullScreen = true }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotación continua
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Efecto de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loaderSize = size === 'large' ? 100 : size === 'small' ? 40 : 60;
  const borderSize = size === 'large' ? 8 : size === 'small' ? 3 : 5;

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              width: loaderSize,
              height: loaderSize,
              transform: [
                { rotate: spin },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Logo R animado */}
          <View style={styles.logoR}>
            <View style={[styles.rVertical, { width: borderSize }]} />
            <View style={[styles.rDiagonal, { width: borderSize * 1.5 }]} />
            <Animated.View
              style={[
                styles.rCurve,
                {
                  width: loaderSize * 0.4,
                  height: loaderSize * 0.4,
                  borderWidth: borderSize,
                },
              ]}
            />
          </View>

          {/* Partículas */}
          {[...Array(8)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  transform: [
                    {
                      rotate: `${(360 / 8) * i}deg`,
                    },
                    {
                      translateX: loaderSize * 0.6,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.particleInner} />
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.Text style={styles.loadingText}>
          RUSSO
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.inlineContainer}>
      <Animated.View
        style={[
          styles.inlineLoader,
          {
            width: loaderSize,
            height: loaderSize,
            transform: [
              { rotate: spin },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <View style={styles.inlineLogoR}>
          <View style={[styles.rVertical, { width: borderSize }]} />
          <View style={[styles.rDiagonal, { width: borderSize * 1.5 }]} />
          <Animated.View
            style={[
              styles.rCurve,
              {
                width: loaderSize * 0.4,
                height: loaderSize * 0.4,
                borderWidth: borderSize,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoR: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rVertical: {
    position: 'absolute',
    height: '70%',
    backgroundColor: '#D4AF37',
    borderRadius: 10,
  },
  rDiagonal: {
    position: 'absolute',
    top: '15%',
    height: '15%',
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    transform: [{ rotate: '-30deg' }],
  },
  rCurve: {
    position: 'absolute',
    top: '30%',
    borderColor: '#D4AF37',
    borderRadius: 50,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 30,
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    letterSpacing: 4,
    opacity: 0.8,
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  inlineLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLogoR: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});