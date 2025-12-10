import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TOAST_TYPES = {
  success: {
    icon: 'check-circle',
    color: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  error: {
    icon: 'alert-circle',
    color: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  warning: {
    icon: 'alert',
    color: '#FFD93D',
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
  },
  info: {
    icon: 'information',
    color: '#6BCF7F',
    backgroundColor: 'rgba(107, 207, 127, 0.1)',
  },
};

export class RussoToast {
  static show(message, type = 'info', duration = 3000) {
    // Esta función será implementada por el provider
    console.log('Toast:', type, message);
  }
}

export const RussoToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (message, type, duration) => {
    setToast({ message, type, duration });
    setVisible(true);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start(() => {
      setVisible(false);
      setToast(null);
    });
  };

  useEffect(() => {
    if (toast) {
      // Animar entrada
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ]).start();

      // Ocultar automáticamente
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Asignar la función estática
  useEffect(() => {
    RussoToast.show = showToast;
  }, []);

  if (!toast || !visible) {
    return children;
  }

  const toastConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <SafeAreaView style={styles.container}>
      {children}
      
      <Animated.View
        style={[
          styles.toastContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }],
            backgroundColor: toastConfig.backgroundColor,
            borderColor: toastConfig.color,
          },
        ]}
      >
        <View style={styles.toastContent}>
          <View style={[styles.iconContainer, { backgroundColor: toastConfig.color }]}>
            <Icon name={toastConfig.icon} size={20} color="#0A0A0A" />
          </View>
          
          <Text style={styles.toastMessage} numberOfLines={2}>
            {toast.message}
          </Text>
          
          <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
            <Icon name="close" size={20} color={toastConfig.color} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    lineHeight: 20,
  },
  closeButton: {
    padding: 5,
    marginLeft: 10,
  },
});