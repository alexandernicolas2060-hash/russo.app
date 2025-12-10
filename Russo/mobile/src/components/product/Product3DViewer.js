import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { TextureLoader, MeshStandardMaterial } from 'three';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

const { width, height } = Dimensions.get('window');

// Componente 3D para el modelo
function Model3D({ modelUrl, autoRotate, scale = 1 }) {
  const { scene } = useGLTF(modelUrl);
  const meshRef = useRef();
  const rotationSpeed = useRef(0.01);
  
  useFrame((state) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed.current;
    }
  });
  
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Material premium con efectos de lujo
          child.material = new MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1,
            emissive: 0x333333,
            emissiveIntensity: 0.2
          });
        }
      });
    }
  }, [scene]);
  
  return <primitive 
    ref={meshRef} 
    object={scene} 
    scale={scale} 
    position={[0, 0, 0]}
  />;
}

// Componente para controles táctiles
function TouchControls({ onRotate, onZoom }) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.numberActiveTouches === 1) {
          // Rotación con un dedo
          onRotate({
            x: gestureState.dx / 100,
            y: gestureState.dy / 100
          });
        } else if (gestureState.numberActiveTouches === 2) {
          // Zoom con dos dedos
          const distance = Math.sqrt(
            Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2)
          );
          onZoom(distance / 100);
        }
      }
    })
  ).current;
  
  return (
    <View 
      style={StyleSheet.absoluteFill}
      {...panResponder.panHandlers}
    />
  );
}

export default function Product3DViewer({
  product,
  autoRotate = true,
  enableZoom = true,
  enableRotate = true,
  onPress,
  style
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;
  
  // Modelo 3D por defecto (cubo) si no hay modelo específico
  const modelUrl = product?.model_3d_url || 'default';
  
  useEffect(() => {
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }).start(() => {
      setIsLoading(false);
    });
  }, []);
  
  const toggleControls = () => {
    Animated.timing(controlsAnim, {
      toValue: showControls ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    setShowControls(!showControls);
  };
  
  const handleRotate = (delta) => {
    setRotation(prev => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y
    }));
  };
  
  const handleZoom = (delta) => {
    if (enableZoom) {
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };
  
  const controlsOpacity = controlsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const controlsTranslateY = controlsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  return (
    <TouchableWithoutFeedback onPress={toggleControls}>
      <Animated.View style={[
        styles.container,
        style,
        { opacity: fadeAnim }
      ]}>
        {/* Canvas 3D */}
        <View style={styles.canvasContainer}>
          <Canvas
            style={styles.canvas}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D4AF37" />
            
            <Model3D 
              modelUrl={modelUrl} 
              autoRotate={autoRotate && !showControls}
              scale={zoom}
            />
            
            {/* Efectos de entorno */}
            <fog attach="fog" args={['#0A0A0A', 10, 25]} />
          </Canvas>
          
          {/* Superposición de degradado */}
          <LinearGradient
            colors={['transparent', 'rgba(10, 10, 10, 0.1)', 'rgba(10, 10, 10, 0.3)']}
            style={styles.canvasOverlay}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
        
        {/* Controles flotantes */}
        <Animated.View style={[
          styles.controlsContainer,
          {
            opacity: controlsOpacity,
            transform: [{ translateY: controlsTranslateY }]
          }
        ]}>
          <LinearGradient
            colors={['rgba(10, 10, 10, 0.9)', 'rgba(26, 26, 26, 0.95)']}
            style={styles.controlsBackground}
          >
            <View style={styles.controlsContent}>
              {/* Instrucciones */}
              <View style={styles.instructions}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionIcon}>
                    <View style={styles.touchIcon} />
                  </View>
                  <Animated.Text style={styles.instructionText}>
                    Toca y arrastra para rotar
                  </Animated.Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <View style={styles.instructionIcon}>
                    <View style={styles.zoomIcon}>
                      <View style={styles.zoomLine1} />
                      <View style={styles.zoomLine2} />
                    </View>
                  </View>
                  <Animated.Text style={styles.instructionText}>
                    Pellizca para hacer zoom
                  </Animated.Text>
                </View>
              </View>
              
              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                <TouchableWithoutFeedback onPress={() => setZoom(1)}>
                  <View style={styles.actionButton}>
                    <Animated.Text style={styles.actionButtonText}>
                      Reset
                    </Animated.Text>
                  </View>
                </TouchableWithoutFeedback>
                
                <TouchableWithoutFeedback onPress={onPress}>
                  <LinearGradient
                    colors={['#D4AF37', '#F7EF8A', '#D4AF37']}
                    style={styles.viewButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Animated.Text style={styles.viewButtonText}>
                      Ver detalles
                    </Animated.Text>
                  </LinearGradient>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Indicador de carga */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingSpinner}>
              <LinearGradient
                colors={['#D4AF37', '#F7EF8A', '#D4AF37']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
            <Animated.Text style={styles.loadingText}>
              Cargando experiencia 3D...
            </Animated.Text>
          </View>
        )}
        
        {/* Controles táctiles invisibles */}
        <TouchControls 
          onRotate={handleRotate}
          onZoom={handleZoom}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: height * 0.6,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative'
  },
  canvas: {
    flex: 1
  },
  canvasOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%'
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden'
  },
  controlsBackground: {
    padding: 20
  },
  controlsContent: {
    gap: 20
  },
  instructions: {
    gap: 12
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  touchIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4AF37'
  },
  zoomIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  zoomLine1: {
    width: 12,
    height: 2,
    backgroundColor: '#D4AF37',
    transform: [{ rotate: '45deg' }]
  },
  zoomLine2: {
    width: 12,
    height: 2,
    backgroundColor: '#D4AF37',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2
  },
  instructionText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    color: '#F5F5F5',
    opacity: 0.8
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.5)'
  },
  actionButtonText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    color: '#F5F5F5',
    opacity: 0.8
  },
  viewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120
  },
  viewButtonText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
    textAlign: 'center'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden'
  },
  loadingText: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    color: '#F5F5F5',
    opacity: 0.8
  }
});
