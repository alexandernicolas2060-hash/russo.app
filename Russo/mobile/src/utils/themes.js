import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Paleta de colores de lujo
export const COLOR_PALETTE = {
  // Tema oscuro (predeterminado)
  dark: {
    primary: '#0A0A0A',
    secondary: '#D4AF37', // Oro
    accent: '#2C2C2C',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#F5F5F5',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    info: '#17A2B8',
    
    // Gradientes
    gradients: {
      primary: ['#0A0A0A', '#1A1A1A', '#0A0A0A'],
      secondary: ['#D4AF37', '#F7EF8A', '#D4AF37'],
      accent: ['#2C2C2C', '#3C3C3C', '#2C2C2C'],
      gold: ['#D4AF37', '#FFD700', '#D4AF37'],
      platinum: ['#E5E4E2', '#FFFFFF', '#E5E4E2']
    }
  },
  
  // Tema claro
  light: {
    primary: '#FFFFFF',
    secondary: '#D4AF37',
    accent: '#F5F5F5',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    info: '#17A2B8',
    
    gradients: {
      primary: ['#FFFFFF', '#FAFAFA', '#FFFFFF'],
      secondary: ['#D4AF37', '#F7EF8A', '#D4AF37'],
      accent: ['#F5F5F5', '#FFFFFF', '#F5F5F5'],
      gold: ['#D4AF37', '#FFD700', '#D4AF37'],
      platinum: ['#E5E4E2', '#FFFFFF', '#E5E4E2']
    }
  },
  
  // Tema negro absoluto
  black: {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#111111',
    background: '#000000',
    surface: '#0A0A0A',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',
    success: '#00FF00',
    error: '#FF0000',
    warning: '#FFFF00',
    info: '#00FFFF',
    
    gradients: {
      primary: ['#000000', '#0A0A0A', '#000000'],
      secondary: ['#FFFFFF', '#CCCCCC', '#FFFFFF'],
      accent: ['#111111', '#222222', '#111111']
    }
  },
  
  // Tema alta costura
  haute: {
    primary: '#1A1A1A',
    secondary: '#C0C0C0', // Plata
    accent: '#2A2A2A',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',
    success: '#00FF88',
    error: '#FF3366',
    warning: '#FFAA00',
    info: '#00CCFF',
    
    gradients: {
      primary: ['#1A1A1A', '#2A2A2A', '#1A1A1A'],
      secondary: ['#C0C0C0', '#FFFFFF', '#C0C0C0'],
      accent: ['#2A2A2A', '#3A3A3A', '#2A2A2A'],
      silver: ['#C0C0C0', '#FFFFFF', '#C0C0C0']
    }
  }
};

// Tipografía elegante
export const TYPOGRAPHY = {
  fontFamily: {
    elegantSerif: 'ElegantSerif',
    elegantSans: 'ElegantSans',
    elegantScript: 'ElegantScript',
    modernMono: 'ModernMono'
  },
  
  fontSize: {
    tiny: 10,
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 20,
    huge: 24,
    xhuge: 28,
    xxhuge: 32,
    giant: 36,
    xgiant: 42,
    xxgiant: 48
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2
  },
  
  fontWeight: {
    thin: '100',
    extraLight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900'
  }
};

// Espaciado y dimensiones
export const SPACING = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 40,
  huge: 48,
  xhuge: 56,
  xxhuge: 64
};

// Bordes estilo Nothing Tech
export const BORDER = {
  radius: {
    none: 0,
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    round: 9999
  },
  
  width: {
    hairline: StyleSheet.hairlineWidth,
    thin: 1,
    medium: 2,
    thick: 4
  },
  
  style: {
    solid: 'solid',
    dotted: 'dotted',
    dashed: 'dashed'
  }
};

// Sombras y elevaciones
export const SHADOW = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  
  intense: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12
  },
  
  glow: (color = '#D4AF37') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  })
};

// Animaciones
export const ANIMATION = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 1000
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: (tension = 200, friction = 20) => ({
      tension,
      friction,
      useNativeDriver: true
    })
  }
};

// Breakpoints responsivos
export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024
};

// Funciones de utilidad
export const createTheme = (themeName = 'dark') => {
  const colors = COLOR_PALETTE[themeName] || COLOR_PALETTE.dark;
  
  return {
    colors,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    border: BORDER,
    shadow: SHADOW,
    animation: ANIMATION,
    breakpoints: BREAKPOINTS,
    
    // Utilidades
    screen: {
      width,
      height
    },
    
    // Mixins comunes
    mixins: {
      center: {
        justifyContent: 'center',
        alignItems: 'center'
      },
      
      row: {
        flexDirection: 'row'
      },
      
      column: {
        flexDirection: 'column'
      },
      
      flex: (value = 1) => ({
        flex: value
      }),
      
      padding: (amount = 'medium') => ({
        padding: typeof amount === 'string' ? SPACING[amount] : amount
      }),
      
      margin: (amount = 'medium') => ({
        margin: typeof amount === 'string' ? SPACING[amount] : amount
      }),
      
      borderRadius: (amount = 'medium') => ({
        borderRadius: typeof amount === 'string' ? BORDER.radius[amount] : amount
      }),
      
      shadow: (type = 'medium') => ({
        ...SHADOW[type]
      }),
      
      text: (variant = 'body') => {
        const variants = {
          display: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSerif,
            fontSize: TYPOGRAPHY.fontSize.xxgiant,
            fontWeight: TYPOGRAPHY.fontWeight.black,
            letterSpacing: TYPOGRAPHY.letterSpacing.tight,
            lineHeight: TYPOGRAPHY.lineHeight.tight
          },
          
          headline: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSerif,
            fontSize: TYPOGRAPHY.fontSize.xgiant,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            letterSpacing: TYPOGRAPHY.letterSpacing.normal,
            lineHeight: TYPOGRAPHY.lineHeight.tight
          },
          
          title: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSerif,
            fontSize: TYPOGRAPHY.fontSize.giant,
            fontWeight: TYPOGRAPHY.fontWeight.semiBold,
            letterSpacing: TYPOGRAPHY.letterSpacing.normal,
            lineHeight: TYPOGRAPHY.lineHeight.normal
          },
          
          subtitle: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSans,
            fontSize: TYPOGRAPHY.fontSize.xlarge,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            letterSpacing: TYPOGRAPHY.letterSpacing.wide,
            lineHeight: TYPOGRAPHY.lineHeight.normal
          },
          
          body: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSans,
            fontSize: TYPOGRAPHY.fontSize.medium,
            fontWeight: TYPOGRAPHY.fontWeight.normal,
            letterSpacing: TYPOGRAPHY.letterSpacing.normal,
            lineHeight: TYPOGRAPHY.lineHeight.relaxed
          },
          
          caption: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSans,
            fontSize: TYPOGRAPHY.fontSize.small,
            fontWeight: TYPOGRAPHY.fontWeight.light,
            letterSpacing: TYPOGRAPHY.letterSpacing.wide,
            lineHeight: TYPOGRAPHY.lineHeight.normal
          },
          
          overline: {
            fontFamily: TYPOGRAPHY.fontFamily.elegantSans,
            fontSize: TYPOGRAPHY.fontSize.tiny,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            letterSpacing: TYPOGRAPHY.letterSpacing.widest,
            lineHeight: TYPOGRAPHY.lineHeight.normal,
            textTransform: 'uppercase'
          }
        };
        
        return variants[variant] || variants.body;
      }
    }
  };
};

// Tema por defecto
export const defaultTheme = createTheme('dark');

// Función para valores responsivos
export const responsive = (phone, tablet, desktop) => {
  if (width < BREAKPOINTS.tablet) return phone;
  if (width < BREAKPOINTS.desktop) return tablet;
  return desktop;
};

// Exportar todo
export default {
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  ANIMATION,
  BREAKPOINTS,
  createTheme,
  defaultTheme,
  responsive
};
