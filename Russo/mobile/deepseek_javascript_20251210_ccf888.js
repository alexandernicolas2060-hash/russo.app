import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export const RussoModal = ({
  visible,
  onClose,
  title,
  children,
  fullScreen = false,
  showCloseButton = true,
  animationType = 'slide',
  backgroundColor = '#0A0A0A',
  overlayColor = 'rgba(0, 0, 0, 0.8)',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Animar entrada
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        animationType === 'scale'
          ? Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
              easing: Easing.out(Easing.back(1.2)),
            }),
      ]).start();
    } else {
      // Animar salida
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        animationType === 'scale'
          ? Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
              easing: Easing.in(Easing.ease),
            })
          : Animated.timing(slideAnim, {
              toValue: height,
              duration: 250,
              useNativeDriver: true,
              easing: Easing.in(Easing.ease),
            }),
      ]).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const modalStyle =
    animationType === 'scale'
      ? {
          transform: [
            { scale: scaleAnim },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        }
      : {
          transform: [{ translateY: slideAnim }],
        };

  return (
    <View style={styles.overlay}>
      {/* Overlay con blur */}
      {Platform.OS === 'ios' ? (
        <BlurView
          style={styles.absolute}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="black"
        />
      ) : (
        <Animated.View
          style={[
            styles.androidOverlay,
            {
              backgroundColor: overlayColor,
              opacity: opacityAnim,
            },
          ]}
        />
      )}

      {/* Overlay táctil para cerrar */}
      <TouchableOpacity
        style={styles.touchableOverlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Modal */}
      <Animated.View
        style={[
          styles.modalContainer,
          fullScreen && styles.fullScreenModal,
          modalStyle,
          { opacity: opacityAnim },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            fullScreen && styles.fullScreenContent,
            { backgroundColor },
          ]}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.modalHeader}>
              {title && (
                <Text style={styles.modalTitle}>{title}</Text>
              )}
              
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <View style={styles.closeButtonInner}>
                    <Icon name="close" size={24} color="#F5F5F5" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.modalBody}>{children}</View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  androidOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenModal: {
    padding: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    maxHeight: '90%',
  },
  fullScreenContent: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
    backgroundColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
  },
});