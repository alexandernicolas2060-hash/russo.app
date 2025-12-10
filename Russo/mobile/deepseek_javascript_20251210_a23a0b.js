import { Animated, Easing } from 'react-native';

// Animación de fade in
export const fadeIn = (value, duration = 300, delay = 0) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

// Animación de fade out
export const fadeOut = (value, duration = 300, delay = 0) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

// Animación de slide up
export const slideUp = (value, distance = 100, duration = 300, delay = 0) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

// Animación de slide down
export const slideDown = (value, distance = 100, duration = 300, delay = 0) => {
  return Animated.timing(value, {
    toValue: distance,
    duration,
    delay,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

// Animación de escala
export const scale = (value, toValue = 1, duration = 300, delay = 0) => {
  return Animated.timing(value, {
    toValue,
    duration,
    delay,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

// Animación de rotación
export const rotate = (value, rotations = 1, duration = 1000, delay = 0) => {
  return Animated.timing(value, {
    toValue: rotations * 360,
    duration,
    delay,
    easing: Easing.linear,
    useNativeDriver: true,
  });
};

// Animación de pulso
export const pulse = (value, min = 0.9, max = 1.1, duration = 500) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: max,
        duration: duration / 2,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: min,
        duration: duration / 2,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// Animación de shake
export const shake = (value, intensity = 10, duration = 500) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: intensity,
      duration: duration / 10,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -intensity,
      duration: duration / 5,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: intensity,
      duration: duration / 5,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -intensity,
      duration: duration / 5,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: intensity,
      duration: duration / 5,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration / 10,
      useNativeDriver: true,
    }),
  ]);
};

// Animación de bounce
export const bounce = (value, height = 20, duration = 300) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: -height,
      duration: duration / 2,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration / 2,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

// Animación de secuencia para logos
export const logoAnimation = (scaleValue, rotateValue, fadeValue) => {
  return Animated.parallel([
    scale(scaleValue, 1, 800),
    rotate(rotateValue, 1, 1200),
    fadeIn(fadeValue, 600, 200),
  ]);
};

// Animación de carga
export const loadingAnimation = (rotateValue, pulseValue) => {
  return Animated.parallel([
    Animated.loop(
      rotate(rotateValue, 1, 2000)
    ),
    pulse(pulseValue, 0.8, 1.2, 1000),
  ]);
};

// Animación de transición de pantalla
export const screenTransition = (fadeValue, slideValue) => {
  return Animated.parallel([
    fadeIn(fadeValue, 400),
    slideUp(slideValue, 50, 400),
  ]);
};

// Animación de botón presionado
export const buttonPress = (scaleValue) => {
  return Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]);
};

// Animación de notificación
export const notificationAnimation = (slideValue, fadeValue) => {
  return Animated.parallel([
    slideUp(slideValue, 100, 300),
    fadeIn(fadeValue, 300),
  ]);
};

// Animación de desvanecimiento gradual
export const staggeredFade = (values, delayBetween = 100) => {
  const animations = values.map((value, index) => 
    fadeIn(value, 300, index * delayBetween)
  );
  return Animated.stagger(delayBetween, animations);
};

// Hook para animaciones reutilizables
export const useAnimation = () => {
  const createAnimation = (type, config = {}) => {
    const {
      value = new Animated.Value(0),
      duration = 300,
      delay = 0,
      easing = Easing.out(Easing.ease),
      useNativeDriver = true,
      ...rest
    } = config;

    switch (type) {
      case 'fadeIn':
        return fadeIn(value, duration, delay);
      case 'fadeOut':
        return fadeOut(value, duration, delay);
      case 'slideUp':
        return slideUp(value, rest.distance || 100, duration, delay);
      case 'slideDown':
        return slideDown(value, rest.distance || 100, duration, delay);
      case 'scale':
        return scale(value, rest.toValue || 1, duration, delay);
      case 'rotate':
        return rotate(value, rest.rotations || 1, duration, delay);
      case 'pulse':
        return pulse(value, rest.min || 0.9, rest.max || 1.1, duration);
      case 'shake':
        return shake(value, rest.intensity || 10, duration);
      case 'bounce':
        return bounce(value, rest.height || 20, duration);
      default:
        return fadeIn(value, duration, delay);
    }
  };

  return { createAnimation };
};

// Exportar todas las animaciones
export default {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  scale,
  rotate,
  pulse,
  shake,
  bounce,
  logoAnimation,
  loadingAnimation,
  screenTransition,
  buttonPress,
  notificationAnimation,
  staggeredFade,
  useAnimation,
};