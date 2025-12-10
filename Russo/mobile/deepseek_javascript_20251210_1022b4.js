import { DefaultTheme } from '@react-navigation/native';

// Paleta de colores Russo
export const colors = {
  // Colores principales
  primary: '#0A0A0A',       // Negro elegante
  secondary: '#D4AF37',     // Oro
  accent: '#F5F5F5',        // Blanco hueso
  
  // Fondos
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2C2C2C',
  
  // Textos
  text: '#F5F5F5',
  textSecondary: '#888888',
  textDisabled: '#666666',
  
  // Estados
  success: '#4ECDC4',
  error: '#FF6B6B',
  warning: '#FFD93D',
  info: '#6BCF7F',
  
  // Bordes
  border: '#2C2C2C',
  borderLight: '#444444',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  
  // Gradientes
  gradientStart: '#0A0A0A',
  gradientEnd: '#1A1A1A',
};

// Tipografía
export const fonts = {
  // Fuentes principales
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  
  // Fuentes elegantes
  elegantRegular: 'PlayfairDisplay-Regular',
  elegantMedium: 'PlayfairDisplay-Medium',
  elegantBold: 'PlayfairDisplay-Bold',
  
  // Fuentes mono
  monoRegular: 'JetBrainsMono-Regular',
  monoBold: 'JetBrainsMono-Bold',
};

// Tamaños de fuente
export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
};

// Espaciado
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

// Bordes
export const borders = {
  none: 0,
  sm: 1,
  base: 2,
  lg: 4,
  xl: 8,
  full: 9999,
  
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
};

// Sombras
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Animaciones
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Temas disponibles
export const themes = {
  'dark-luxe': {
    name: 'Lujo Oscuro',
    colors: {
      primary: '#0A0A0A',
      secondary: '#D4AF37',
      accent: '#F5F5F5',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#F5F5F5',
      border: '#2C2C2C',
    },
  },
  'black-diamond': {
    name: 'Diamante Negro',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#E0E0E0',
      background: '#000000',
      surface: '#111111',
      text: '#FFFFFF',
      border: '#333333',
    },
  },
  'platinum': {
    name: 'Platino',
    colors: {
      primary: '#2C3E50',
      secondary: '#95A5A6',
      accent: '#ECF0F1',
      background: '#2C3E50',
      surface: '#34495E',
      text: '#ECF0F1',
      border: '#4A6572',
    },
  },
  'midnight-gold': {
    name: 'Oro Medianoche',
    colors: {
      primary: '#1A1A1A',
      secondary: '#FFD700',
      accent: '#F8F8F8',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      text: '#F8F8F8',
      border: '#404040',
    },
  },
  'obsidian': {
    name: 'Obsidiana',
    colors: {
      primary: '#0B0B0B',
      secondary: '#8B4513',
      accent: '#D3D3D3',
      background: '#0B0B0B',
      surface: '#1C1C1C',
      text: '#D3D3D3',
      border: '#363636',
    },
  },
};

// Tema principal de React Navigation
export const RussoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.secondary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
  fonts: {
    regular: fonts.regular,
    medium: fonts.medium,
    bold: fonts.bold,
    heavy: fonts.elegantBold,
  },
};

// Hook personalizado para usar el tema
export const useRussoTheme = () => {
  return {
    colors,
    fonts,
    fontSizes,
    spacing,
    borders,
    shadows,
    animations,
    themes,
  };
};