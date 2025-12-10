// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Russo',
  version: '1.0.0',
  build: 1,
  url: 'https://russo.app',
  supportEmail: 'soporte@russo.app',
  contactPhone: '+584141234567',
};

// URLs de API
export const API_URLS = {
  base: 'http://localhost:3001/api',
  auth: '/auth',
  products: '/products',
  cart: '/cart',
  orders: '/orders',
  users: '/users',
  widgets: '/widgets',
};

// Rutas de navegación
export const ROUTES = {
  // Auth
  AUTH: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFICATION: 'Verification',
  
  // Main
  HOME: 'Home',
  SEARCH: 'Search',
  CART: 'Cart',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  
  // Products
  PRODUCT_DETAIL: 'ProductDetail',
  ALL_PRODUCTS: 'AllProducts',
  CATEGORY: 'Category',
  
  // Orders
  CHECKOUT: 'Checkout',
  ORDER_CONFIRMATION: 'OrderConfirmation',
  ORDER_DETAIL: 'OrderDetail',
  ORDER_HISTORY: 'OrderHistory',
  
  // Account
  ADDRESSES: 'Addresses',
  PAYMENT_METHODS: 'PaymentMethods',
  FAVORITES: 'Favorites',
  NOTIFICATIONS: 'Notifications',
  
  // Menu
  MENU: 'Menu',
  ABOUT: 'About',
  HELP: 'Help',
  CONTACT: 'Contact',
  PRIVACY: 'Privacy',
  TERMS: 'Terms',
};

// Categorías de productos
export const CATEGORIES = [
  { id: 'hogar', name: 'Hogar y Vida Diaria', icon: 'home' },
  { id: 'tecnologia', name: 'Tecnología y Electrónica', icon: 'laptop' },
  { id: 'moda', name: 'Moda y Accesorios', icon: 'tshirt-crew' },
  { id: 'belleza', name: 'Belleza y Cuidado Personal', icon: 'lipstick' },
  { id: 'deportes', name: 'Deportes y Aire Libre', icon: 'basketball' },
  { id: 'herramientas', name: 'Herramientas y Mejoras del Hogar', icon: 'hammer' },
  { id: 'automotriz', name: 'Automotriz', icon: 'car' },
  { id: 'educacion', name: 'Educación y Oficina', icon: 'book-open' },
  { id: 'alimentos', name: 'Alimentos y Bebidas', icon: 'food' },
  { id: 'bebes', name: 'Bebés y Niños', icon: 'baby-carriage' },
  { id: 'juguetes', name: 'Juguetes y Entretenimiento', icon: 'gamepad-variant' },
  { id: 'salud', name: 'Salud y Bienestar', icon: 'heart-pulse' },
  { id: 'arte', name: 'Arte, Manualidades y Pasatiempos', icon: 'palette' },
  { id: 'especializados', name: 'Productos Regionales/Especializados', icon: 'star' },
];

// Géneros
export const GENDERS = [
  { id: 'hombre', name: 'Hombre', icon: 'gender-male' },
  { id: 'mujer', name: 'Mujer', icon: 'gender-female' },
  { id: 'unisex', name: 'Unisex', icon: 'gender-male-female' },
];

// Métodos de pago
export const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Tarjeta de Crédito', icon: 'credit-card' },
  { id: 'debit_card', name: 'Tarjeta de Débito', icon: 'credit-card-outline' },
  { id: 'paypal', name: 'PayPal', icon: 'paypal' },
  { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: 'bank' },
  { id: 'cash', name: 'Efectivo', icon: 'cash' },
];

// Estados de pedido
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Idiomas soportados
export const LANGUAGES = [
  { code: 'es-VE', name: 'Español (Venezuela)', flag: '🇻🇪' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Portugués (Brasil)', flag: '🇧🇷' },
  { code: 'fr-FR', name: 'Francés', flag: '🇫🇷' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de-DE', name: 'Alemán', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japonés', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chino', flag: '🇨🇳' },
  { code: 'ru-RU', name: 'Ruso', flag: '🇷🇺' },
  { code: 'ar-SA', name: 'Árabe', flag: '🇸🇦' },
  { code: 'ko-KR', name: 'Coreano', flag: '🇰🇷' },
  // Agregar más idiomas según sea necesario
];

// Temas disponibles
export const THEMES = [
  { id: 'dark-luxe', name: 'Lujo Oscuro', color: '#0A0A0A' },
  { id: 'black-diamond', name: 'Diamante Negro', color: '#000000' },
  { id: 'platinum', name: 'Platino', color: '#E5E4E2' },
  { id: 'midnight-gold', name: 'Oro Medianoche', color: '#1A1A1A' },
  { id: 'obsidian', name: 'Obsidiana', color: '#0B0B0B' },
];

// Widgets disponibles
export const WIDGET_TYPES = [
  { id: 'recent_products', name: 'Productos Recientes', icon: 'clock' },
  { id: 'special_offers', name: 'Ofertas Especiales', icon: 'tag' },
  { id: 'recommended', name: 'Recomendados', icon: 'thumb-up' },
  { id: 'order_status', name: 'Estado de Pedido', icon: 'package' },
  { id: 'russo_news', name: 'Novedades Russo', icon: 'newspaper' },
  { id: 'favorites', name: 'Favoritos', icon: 'heart' },
  { id: 'quick_cart', name: 'Carrito Rápido', icon: 'cart' },
  { id: 'quick_search', name: 'Búsqueda Rápida', icon: 'magnify' },
  { id: 'notifications', name: 'Notificaciones', icon: 'bell' },
  { id: 'exclusive_events', name: 'Eventos Exclusivos', icon: 'calendar' },
  { id: 'wishlist', name: 'Lista de Deseos', icon: 'gift' },
  { id: 'history', name: 'Historial', icon: 'history' },
  { id: 'personal_metrics', name: 'Métricas Personales', icon: 'chart-bar' },
  { id: 'shortcuts', name: 'Accesos Directos', icon: 'link' },
  { id: 'interactive_3d', name: 'Interactivo 3D', icon: 'cube' },
];

// Configuración de widgets
export const WIDGET_CONFIG = {
  maxWidgets: 15,
  refreshInterval: 300000, // 5 minutos
  sizes: {
    small: { width: 2, height: 2 },
    medium: { width: 4, height: 2 },
    large: { width: 4, height: 4 },
  },
};

// Límites y restricciones
export const LIMITS = {
  MAX_PRODUCTS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE: 104857600, // 100MB
  MAX_CART_ITEMS: 50,
  MAX_FAVORITES: 100,
  MAX_ADDRESSES: 10,
  MAX_PAYMENT_METHODS: 5,
};

// Expresiones regulares para validación
export const REGEX = {
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  CREDIT_CARD: /^\d{16}$/,
  CVV: /^\d{3,4}$/,
  EXPIRY_DATE: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
};

// Mensajes de error
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_PASSWORD: 'Contraseña inválida',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  MIN_LENGTH: (length) => `Mínimo ${length} caracteres`,
  MAX_LENGTH: (length) => `Máximo ${length} caracteres`,
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  SERVER_ERROR: 'Error del servidor. Intenta nuevamente.',
  UNAUTHORIZED: 'No autorizado. Inicia sesión nuevamente.',
  NOT_FOUND: 'Recurso no encontrado.',
  GENERIC: 'Algo salió mal. Intenta nuevamente.',
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  TYPES: {
    NEW_PRODUCT: 'new_product',
    ORDER_UPDATE: 'order_update',
    PROMOTION: 'promotion',
    SYSTEM: 'system',
  },
  CHANNELS: {
    DEFAULT: 'russo-default',
    ORDERS: 'russo-orders',
    PROMOTIONS: 'russo-promotions',
    SYSTEM: 'russo-system',
  },
  PRIORITIES: {
    MIN: 'min',
    LOW: 'low',
    DEFAULT: 'default',
    HIGH: 'high',
    MAX: 'max',
  },
};

// Configuración de caché
export const CACHE_CONFIG = {
  TTL: {
    PRODUCTS: 3600000, // 1 hora
    USER_DATA: 1800000, // 30 minutos
    WIDGETS: 300000, // 5 minutos
    CONFIG: 86400000, // 24 horas
  },
  KEYS: {
    PRODUCTS: '@russo_products_cache',
    USER: '@russo_user_cache',
    WIDGETS: '@russo_widgets_cache',
    CONFIG: '@russo_config_cache',
  },
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    SPRING: 'spring',
  },
};

// Exportar todo como objeto único para fácil importación
export default {
  APP_CONFIG,
  API_URLS,
  ROUTES,
  CATEGORIES,
  GENDERS,
  PAYMENT_METHODS,
  ORDER_STATUS,
  LANGUAGES,
  THEMES,
  WIDGET_TYPES,
  WIDGET_CONFIG,
  LIMITS,
  REGEX,
  ERROR_MESSAGES,
  NOTIFICATION_CONFIG,
  CACHE_CONFIG,
  ANIMATION_CONFIG,
};