import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const letterRAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación compleja en 4 fases
    Animated.sequence([
      // Fase 1: Aparece la R
      Animated.timing(letterRAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55)
      }),
      
      // Fase 2: La R se transforma en "Russo"
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      
      // Fase 3: Logo se mueve hacia arriba
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      
      // Fase 4: Desvanecimiento gradual mientras baja
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          delay: 200,
          useNativeDriver: true
        }),
        Animated.timing(logoAnim, {
          toValue: 2,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic)
        })
      ])
    ]).start();
  }, []);

  // Interpolaciones para la R
  const rScale = letterRAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  const rRotate = letterRAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  });

  // Interpolaciones para el texto "usso"
  const textOpacity = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const textTranslateX = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0]
  });

  // Interpolaciones para el logo completo
  const logoTranslateY = logoAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, -height * 0.3, -height * 0.1]
  });

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 0.7, 0.5]
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Efecto de partículas de lujo */}
        <View style={styles.particles}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3]
                  })
                }
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: logoTranslateY },
                { scale: logoScale }
              ]
            }
          ]}
        >
          {/* Letra R animada */}
          <Animated.View
            style={[
              styles.letterR,
              {
                transform: [
                  { scale: rScale },
                  { rotate: rRotate }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#D4AF37', '#F7EF8A', '#D4AF37']}
              style={styles.rGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.rInner}>
                <View style={styles.rVertical} />
                <View style={styles.rCurve} />
                <View style={styles.rDiagonal} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Texto "usso" que aparece */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateX: textTranslateX }]
              }
            ]}
          >
            <Animated.Text style={styles.ussoText}>usso</Animated.Text>
          </Animated.View>
        </Animated.View>

        {/* Efecto de brillo */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: letterRAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.2]
              })
            }
          ]}
        />

        {/* Texto de bienvenida sutil */}
        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              opacity: textAnim,
              transform: [
                {
                  translateY: textAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }
              ]
            }
          ]}
        >
          <Animated.Text style={styles.welcomeText}>
            Lo exclusivo. Lo elegante. Russo.
          </Animated.Text>
          <View style={styles.welcomeLine} />
        </Animated.View>

        {/* Indicador de carga elegante */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingBar,
              {
                width: logoAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0%', '50%', '100%']
                })
              }
            ]}
          />
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: textAnim
              }
            ]}
          >
            Preparando experiencia exclusiva...
          </Animated.Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A'
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#D4AF37',
    borderRadius: 2
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  letterR: {
    width: 120,
    height: 180,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30
  },
  rGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rInner: {
    width: 80,
    height: 140,
    position: 'relative'
  },
  rVertical: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 20,
    height: 120,
    backgroundColor: '#0A0A0A',
    borderRadius: 10
  },
  rCurve: {
    position: 'absolute',
    left: 30,
    top: 10,
    width: 40,
    height: 60,
    borderWidth: 20,
    borderColor: '#0A0A0A',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    borderLeftWidth: 0
  },
  rDiagonal: {
    position: 'absolute',
    left: 30,
    top: 70,
    width: 30,
    height: 20,
    backgroundColor: '#0A0A0A',
    transform: [{ rotate: '45deg' }],
    borderRadius: 5
  },
  textContainer: {
    marginLeft: 10
  },
  ussoText: {
    fontFamily: 'ElegantSerif',
    fontSize: 72,
    color: '#F5F5F5',
    letterSpacing: 6,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#D4AF37',
    opacity: 0.2,
    filter: 'blur(40px)'
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 60
  },
  welcomeText: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    color: '#B0B0B0',
    letterSpacing: 3,
    textAlign: 'center'
  },
  welcomeLine: {
    width: 100,
    height: 1,
    backgroundColor: '#D4AF37',
    marginTop: 10,
    opacity: 0.5
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: '80%',
    alignItems: 'center'
  },
  loadingBar: {
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 15
  },
  loadingText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    color: '#B0B0B0',
    letterSpacing: 1
  }
});
