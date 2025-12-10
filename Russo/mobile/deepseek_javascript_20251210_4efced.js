import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function ConnectionScreen() {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Animación de la R
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    }).start();

    // Transformación a RUSSO
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Animación del texto completo
    setTimeout(() => {
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Navegar después de la animación
        setTimeout(() => {
          navigation.replace('Auth');
        }, 1000);
      });
    }, 1600);
  };

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        {/* Letra R inicial */}
        <Animated.View
          style={[
            styles.letterR,
            {
              transform: [
                { scale: scaleAnim },
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.letterRText}>R</Text>
        </Animated.View>

        {/* Texto RUSSO completo */}
        <Animated.View
          style={[
            styles.fullTextContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.russoText,
              {
                opacity: textAnim,
                transform: [
                  {
                    scale: textAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            USSO
          </Animated.Text>
        </Animated.View>

        {/* Efecto de partículas */}
        <View style={styles.particles}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * 100,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Animación Lottie adicional */}
      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../../assets/animations/gold-sparkle.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Texto de carga */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.loadingText}>Cargando exclusividad...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
    position: 'relative',
  },
  letterR: {
    position: 'absolute',
    zIndex: 10,
  },
  letterRText: {
    fontSize: 96,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#D4AF37',
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  fullTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  russoText: {
    fontSize: 72,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    letterSpacing: 8,
    marginLeft: 60,
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },
  lottieContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  lottie: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#888888',
    letterSpacing: 2,
  },
});