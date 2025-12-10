const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logToFile } = require('../utils/logger');

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// OBTENER TODOS LOS WIDGETS DISPONIBLES
router.get('/', async (req, res) => {
  try {
    const widgets = await db.all(`
      SELECT * FROM widgets 
      WHERE is_active = 1
      ORDER BY display_order ASC
    `);
    
    // Parsear configuración
    widgets.forEach(widget => {
      if (widget.configuration) {
        try {
          widget.configuration = JSON.parse(widget.configuration);
        } catch (e) {
          widget.configuration = {};
        }
      }
    });
    
    res.json({
      success: true,
      widgets,
      total: widgets.length
    });
    
  } catch (error) {
    console.error('Error al obtener widgets:', error);
    logToFile('error', 'Error en GET /widgets', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER WIDGETS DEL USUARIO
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    const userWidgets = await db.all(`
      SELECT 
        uw.*,
        w.name, w.type, w.description, w.size, w.configuration,
        w.data_source, w.refresh_interval, w.requires_auth, w.platform
      FROM user_widgets uw
      JOIN widgets w ON uw.widget_id = w.id
      WHERE uw.user_id = ? AND uw.is_enabled = 1 AND w.is_active = 1
      ORDER BY uw.position ASC
    `, [userId]);
    
    // Parsear configuraciones
    userWidgets.forEach(widget => {
      if (widget.configuration) {
        try {
          widget.configuration = JSON.parse(widget.configuration);
        } catch (e) {
          widget.configuration = {};
        }
      }
      
      if (widget.custom_config) {
        try {
          widget.custom_config = JSON.parse(widget.custom_config);
        } catch (e) {
          widget.custom_config = {};
        }
      }
    });
    
    res.json({
      success: true,
      widgets: userWidgets,
      count: userWidgets.length
    });
    
  } catch (error) {
    console.error('Error al obtener widgets del usuario:', error);
    logToFile('error', 'Error en GET /widgets/user', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ACTUALIZAR WIDGETS DEL USUARIO
router.put('/user', authenticate, [
  body('widgets').isArray().withMessage('Widgets debe ser un array'),
  body('widgets.*.widget_id').isInt().withMessage('ID de widget inválido'),
  body('widgets.*.is_enabled').isBoolean().withMessage('Estado inválido'),
  body('widgets.*.position').isInt().withMessage('Posición inválida'),
  body('widgets.*.custom_config').optional().isObject().withMessage('Configuración personalizada inválida')
], validateRequest, async (req, res) => {
  try {
    const { widgets } = req.body;
    const userId = req.userId;
    
    // Limitar máximo de widgets
    const maxWidgets = 15;
    if (widgets.length > maxWidgets) {
      return res.status(400).json({ 
        error: `Máximo ${maxWidgets} widgets permitidos` 
      });
    }
    
    // Eliminar widgets actuales del usuario
    await db.run('DELETE FROM user_widgets WHERE user_id = ?', [userId]);
    
    // Insertar nuevos widgets
    for (const widget of widgets) {
      if (widget.is_enabled) {
        await db.run(`
          INSERT INTO user_widgets (user_id, widget_id, position, is_enabled, custom_config)
          VALUES (?, ?, ?, ?, ?)
        `, [
          userId,
          widget.widget_id,
          widget.position,
          1,
          widget.custom_config ? JSON.stringify(widget.custom_config) : null
        ]);
      }
    }
    
    logToFile('info', `Widgets actualizados para usuario ${userId}`, { 
      widget_count: widgets.length 
    });
    
    res.json({
      success: true,
      message: 'Widgets actualizados exitosamente',
      updated_count: widgets.length
    });
    
  } catch (error) {
    console.error('Error al actualizar widgets:', error);
    logToFile('error', 'Error en PUT /widgets/user', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER DATOS DE WIDGET ESPECÍFICO
router.get('/data/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.userId;
    
    let data;
    
    switch (type) {
      case 'new_products':
        data = await getNewProductsData();
        break;
        
      case 'special_offers':
        data = await getSpecialOffersData();
        break;
        
      case 'recommended':
        data = await getRecommendedData(userId);
        break;
        
      case 'order_status':
        data = await getOrderStatusData(userId);
        break;
        
      case 'russo_news':
        data = await getRussoNewsData();
        break;
        
      case 'favorites':
        data = await getFavoritesData(userId);
        break;
        
      case 'quick_cart':
        data = await getQuickCartData(userId);
        break;
        
      case 'quick_search':
        data = await getQuickSearchData();
        break;
        
      case 'notifications':
        data = await getNotificationsData(userId);
        break;
        
      case 'exclusive_events':
        data = await getExclusiveEventsData();
        break;
        
      case 'wishlist':
        data = await getWishlistData(userId);
        break;
        
      case 'history':
        data = await getHistoryData(userId);
        break;
        
      case 'personal_metrics':
        data = await getPersonalMetricsData(userId);
        break;
        
      case 'shortcuts':
        data = await getShortcutsData();
        break;
        
      case 'interactive_3d':
        data = await getInteractive3DData();
        break;
        
      default:
        return res.status(404).json({ error: 'Tipo de widget no encontrado' });
    }
    
    res.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error al obtener datos del widget ${req.params.type}:`, error);
    logToFile('error', `Error en GET /widgets/data/${req.params.type}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// FUNCIONES AUXILIARES PARA DATOS DE WIDGETS

async function getNewProductsData() {
  const products = await db.all(`
    SELECT 
      id, name, price, compare_price, main_image_url, 
      rating, rating_count, is_new, created_at
    FROM products 
    WHERE is_active = 1 
      AND published_at IS NOT NULL
      AND (stock_quantity > 0 OR stock_quantity IS NULL)
    ORDER BY created_at DESC
    LIMIT 5
  `);
  
  return {
    title: 'Nuevos Productos',
    products: products.map(p => ({
      ...p,
      has_discount: p.compare_price && p.compare_price > p.price,
      discount_percent: p.compare_price ? 
        Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : null
    }))
  };
}

async function getSpecialOffersData() {
  const products = await db.all(`
    SELECT 
      id, name, price, compare_price, main_image_url, 
      rating, rating_count, is_new, created_at
    FROM products 
    WHERE is_active = 1 
      AND published_at IS NOT NULL
      AND compare_price IS NOT NULL
      AND compare_price > price
      AND (stock_quantity > 0 OR stock_quantity IS NULL)
    ORDER BY (compare_price - price) / compare_price DESC
    LIMIT 3
  `);
  
  return {
    title: 'Ofertas Especiales',
    products: products.map(p => ({
      ...p,
      discount_percent: Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
    }))
  };
}

async function getRecommendedData(userId) {
  // Basado en historial de compras y vistas
  const products = await db.all(`
    SELECT DISTINCT
      p.id, p.name, p.price, p.compare_price, p.main_image_url, 
      p.rating, p.rating_count, p.is_new, p.created_at
    FROM products p
    WHERE p.is_active = 1 
      AND p.published_at IS NOT NULL
      AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
    ORDER BY RANDOM()
    LIMIT 4
  `);
  
  return {
    title: 'Recomendados para ti',
    products
  };
}

async function getOrderStatusData(userId) {
  const order = await db.get(`
    SELECT 
      id, order_number, status, total_amount, created_at,
      estimated_delivery
    FROM orders 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [userId]);
  
  if (!order) {
    return {
      title: 'Estado de Pedido',
      has_order: false,
      message: 'No tienes pedidos recientes'
    };
  }
  
  return {
    title: 'Tu Último Pedido',
    has_order: true,
    order: {
      ...order,
      status_text: getOrderStatusText(order.status),
      days_ago: Math.floor((Date.now() - new Date(order.created_at)) / (1000 * 60 * 60 * 24))
    }
  };
}

async function getRussoNewsData() {
  // Noticias estáticas (en producción vendrían de una tabla de noticias)
  const news = [
    {
      id: 1,
      title: 'Nueva Colección Otoño/Invierno 2024',
      excerpt: 'Descubre nuestra exclusiva colección de temporada',
      date: '2024-10-15',
      type: 'collection'
    },
    {
      id: 2,
      title: 'Evento Exclusivo para Clientes VIP',
      excerpt: 'Acceso anticipado a productos limitados',
      date: '2024-10-20',
      type: 'event'
    },
    {
      id: 3,
      title: 'Nueva Funcionalidad: Widgets Personalizables',
      excerpt: 'Personaliza tu experiencia Russo',
      date: '2024-10-25',
      type: 'feature'
    }
  ];
  
  return {
    title: 'Novedades Russo',
    news,
    show_more: true
  };
}

async function getFavoritesData(userId) {
  const favorites = await db.all(`
    SELECT 
      p.id, p.name, p.price, p.main_image_url, p.rating
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ? 
      AND p.is_active = 1
    ORDER BY f.created_at DESC
    LIMIT 3
  `, [userId]);
  
  return {
    title: 'Tus Favoritos',
    favorites,
    count: favorites.length,
    show_all: favorites.length > 3
  };
}

async function getQuickCartData(userId) {
  const cart = await db.get(`
    SELECT 
      COUNT(*) as item_count,
      SUM(quantity) as total_items,
      SUM(price * quantity) as subtotal
    FROM cart 
    WHERE user_id = ?
  `, [userId]);
  
  return {
    title: 'Carrito Rápido',
    item_count: cart.item_count || 0,
    total_items: cart.total_items || 0,
    subtotal: cart.subtotal || 0,
    has_items: (cart.item_count || 0) > 0
  };
}

async function getQuickSearchData() {
  const popularSearches = await db.all(`
    SELECT query, COUNT(*) as count
    FROM searches
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY query
    ORDER BY count DESC
    LIMIT 5
  `);
  
  return {
    title: 'Búsqueda Rápida',
    popular_searches: popularSearches.map(s => s.query),
    recent_searches: [] // Se llenaría con historial del usuario
  };
}

async function getNotificationsData(userId) {
  const notifications = await db.all(`
    SELECT 
      id, type, title, message, is_read, sent_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY sent_at DESC
    LIMIT 3
  `, [userId]);
  
  const unreadCount = await db.get(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `, [userId]);
  
  return {
    title: 'Notificaciones',
    notifications,
    unread_count: unreadCount.count || 0,
    has_unread: (unreadCount.count || 0) > 0
  };
}

async function getExclusiveEventsData() {
  // Eventos estáticos (en producción vendrían de una tabla de eventos)
  const events = [
    {
      id: 1,
      title: 'Lanzamiento Producto Limitado',
      date: '2024-11-01',
      time: '20:00',
      type: 'product_launch',
      exclusive: true
    },
    {
      id: 2,
      title: 'Private Sale VIP',
      date: '2024-11-05',
      time: '10:00',
      type: 'sale',
      exclusive: true
    }
  ];
  
  return {
    title: 'Eventos Exclusivos',
    events,
    upcoming_count: events.length
  };
}

async function getWishlistData(userId) {
  const wishlist = await db.all(`
    SELECT 
      p.id, p.name, p.price, p.main_image_url, 
      p.is_featured, p.stock_quantity
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ? 
      AND p.is_active = 1
    ORDER BY f.created_at DESC
    LIMIT 4
  `, [userId]);
  
  return {
    title: 'Tu Wishlist',
    items: wishlist,
    count: wishlist.length,
    has_items: wishlist.length > 0
  };
}

async function getHistoryData(userId) {
  const history = await db.all(`
    SELECT 
      p.id, p.name, p.price, p.main_image_url,
      MAX(s.created_at) as last_viewed
    FROM searches s
    JOIN products p ON s.query LIKE '%' || p.name || '%'
    WHERE s.user_id = ?
      AND p.is_active = 1
    GROUP BY p.id
    ORDER BY last_viewed DESC
    LIMIT 4
  `, [userId]);
  
  return {
    title: 'Tu Historial',
    items: history,
    count: history.length
  };
}

async function getPersonalMetricsData(userId) {
  const orders = await db.get(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_spent,
      AVG(total_amount) as avg_order_value
    FROM orders 
    WHERE user_id = ? 
      AND status NOT IN ('cancelled', 'refunded')
  `, [userId]);
  
  const favorites = await db.get(`
    SELECT COUNT(*) as total_favorites
    FROM favorites 
    WHERE user_id = ?
  `, [userId]);
  
  return {
    title: 'Tus Métricas',
    metrics: {
      total_orders: orders.total_orders || 0,
      total_spent: orders.total_spent || 0,
      avg_order_value: orders.avg_order_value || 0,
      total_favorites: favorites.total_favorites || 0
    }
  };
}

async function getShortcutsData() {
  const shortcuts = [
    { id: 1, name: 'Nuevos', icon: 'new', route: '/new' },
    { id: 2, name: 'Ofertas', icon: 'sale', route: '/sale' },
    { id: 3, name: 'Categorías', icon: 'categories', route: '/categories' },
    { id: 4, name: 'Favoritos', icon: 'favorites', route: '/favorites' },
    { id: 5, name: 'Carrito', icon: 'cart', route: '/cart' },
    { id: 6, name: 'Perfil', icon: 'profile', route: '/profile' }
  ];
  
  return {
    title: 'Accesos Directos',
    shortcuts,
    customizable: true
  };
}

async function getInteractive3DData() {
  const product = await db.get(`
    SELECT 
      id, name, price, model_3d_url, model_3d_thumbnail,
      short_description
    FROM products 
    WHERE is_3d_available = 1 
      AND is_active = 1
      AND published_at IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
  `);
  
  if (!product) {
    return {
      title: 'Producto 3D del Día',
      has_product: false,
      message: 'No hay productos 3D disponibles'
    };
  }
  
  return {
    title: 'Producto 3D del Día',
    has_product: true,
    product: {
      ...product,
      interactive: true,
      auto_rotate: true
    }
  };
}

// Función auxiliar para texto de estado
function getOrderStatusText(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'processing': 'En preparación',
    'shipped': 'Enviado',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado'
  };
  
  return statusMap[status] || status;
}

// REORDENAR WIDGETS
router.post('/reorder', authenticate, [
  body('widgets').isArray().withMessage('Widgets debe ser un array'),
  body('widgets.*.id').isInt().withMessage('ID de widget inválido'),
  body('widgets.*.position').isInt().withMessage('Posición inválida')
], validateRequest, async (req, res) => {
  try {
    const { widgets } = req.body;
    const userId = req.userId;
    
    // Actualizar posiciones
    for (const widget of widgets) {
      await db.run(`
        UPDATE user_widgets 
        SET position = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [widget.position, widget.id, userId]);
    }
    
    logToFile('info', `Widgets reordenados para usuario ${userId}`);
    
    res.json({
      success: true,
      message: 'Widgets reordenados exitosamente'
    });
    
  } catch (error) {
    console.error('Error al reordenar widgets:', error);
    logToFile('error', 'Error en POST /widgets/reorder', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
