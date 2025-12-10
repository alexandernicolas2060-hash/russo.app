require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getLocalIP } = require('./setup');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;
const LOCAL_IP = getLocalIP();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/russo/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/russo/config', express.static(path.join(__dirname, 'config')));

// ==================== RUTAS PRINCIPALES ====================

// Health Check
app.get('/russo/health', (req, res) => {
  res.json({
    status: 'operational',
    app: 'Russo Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: {
      server_ip: LOCAL_IP,
      client_ip: req.ip,
      port: PORT
    },
    endpoints: {
      api: `http://${LOCAL_IP}:${PORT}/russo/api/v1`,
      health: `http://${LOCAL_IP}:${PORT}/russo/health`,
      config: `http://${LOCAL_IP}:${PORT}/russo/config/mobile-config.json`
    }
  });
});

// Configuración para móvil
app.get('/russo/config/mobile', (req, res) => {
  const configPath = path.join(__dirname, 'config', 'mobile-config.json');
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } else {
    res.json({
      backend: {
        url: `http://${LOCAL_IP}:${PORT}`,
        endpoints: {
          api: `http://${LOCAL_IP}:${PORT}/russo/api/v1`,
          health: `http://${LOCAL_IP}:${PORT}/russo/health`
        }
      },
      auto_detected: true
    });
  }
});

// Descubrimiento automático
app.get('/russo/discover', (req, res) => {
  res.json({
    service: 'russo-backend',
    url: `http://${LOCAL_IP}:${PORT}`,
    endpoints: ['/russo/health', '/russo/api/v1', '/russo/config/mobile']
  });
});

// ==================== API RUTAS ====================

// Auth Routes
app.post('/russo/api/v1/auth/register', (req, res) => {
  const { phone, name, password } = req.body;
  
  if (!phone || !name || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  // Simulación de registro
  res.json({
    success: true,
    message: 'Usuario registrado. Verifica tu teléfono.',
    user_id: 'user_' + Date.now(),
    requires_verification: true
  });
});

app.post('/russo/api/v1/auth/verify', (req, res) => {
  const { phone, code } = req.body;
  
  if (!phone || !code) {
    return res.status(400).json({ error: 'Teléfono y código requeridos' });
  }
  
  // Simulación de verificación
  res.json({
    success: true,
    message: 'Teléfono verificado',
    token: 'jwt_token_' + Date.now(),
    user: {
      id: 'user_123',
      phone: phone,
      name: 'Usuario Russo'
    }
  });
});

app.post('/russo/api/v1/auth/login', (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'Teléfono y contraseña requeridos' });
  }
  
  // Simulación de login
  res.json({
    success: true,
    token: 'jwt_token_' + Date.now(),
    user: {
      id: 'user_123',
      phone: phone,
      name: 'Usuario Russo'
    }
  });
});

// Product Routes
app.get('/russo/api/v1/products', (req, res) => {
  const products = [
    {
      id: 'P001',
      name: 'iPhone 15 Pro Max',
      description: 'Smartphone premium Apple',
      price: 1799.99,
      category: 'Tecnología',
      stock: 10,
      is_featured: true,
      image_url: ''
    },
    {
      id: 'P002',
      name: 'Sofá Chesterfield',
      description: 'Sofá de cuero italiano',
      price: 4499.99,
      category: 'Muebles',
      stock: 3,
      is_featured: true,
      image_url: ''
    },
    {
      id: 'P003',
      name: 'Reloj Cartier',
      description: 'Reloj de lujo automático',
      price: 12499.99,
      category: 'Joyas',
      stock: 1,
      is_featured: true,
      image_url: ''
    },
    {
      id: 'P004',
      name: 'Vestido Dior',
      description: 'Vestido alta costura',
      price: 8899.99,
      category: 'Moda',
      stock: 5,
      is_featured: false,
      image_url: ''
    }
  ];
  
  // Filtrar por categoría si se especifica
  const category = req.query.category;
  let filteredProducts = products;
  
  if (category) {
    filteredProducts = products.filter(p => p.category === category);
  }
  
  res.json({
    success: true,
    products: filteredProducts,
    total: filteredProducts.length
  });
});

app.get('/russo/api/v1/products/:id', (req, res) => {
  const productId = req.params.id;
  const products = [
    { id: 'P001', name: 'iPhone 15 Pro Max', price: 1799.99, category: 'Tecnología' },
    { id: 'P002', name: 'Sofá Chesterfield', price: 4499.99, category: 'Muebles' },
    { id: 'P003', name: 'Reloj Cartier', price: 12499.99, category: 'Joyas' },
    { id: 'P004', name: 'Vestido Dior', price: 8899.99, category: 'Moda' }
  ];
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  res.json({
    success: true,
    product: {
      ...product,
      description: `Descripción detallada de ${product.name}`,
      specifications: {
        material: 'Premium',
        origin: 'Internacional',
        warranty: '2 años'
      },
      images: [],
      related_products: products.filter(p => p.id !== productId).slice(0, 3)
    }
  });
});

// Cart Routes
app.post('/russo/api/v1/cart/add', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  
  res.json({
    success: true,
    message: 'Producto añadido al carrito',
    cart_item: {
      id: 'cart_item_' + Date.now(),
      product_id,
      quantity,
      added_at: new Date().toISOString()
    }
  });
});

app.get('/russo/api/v1/cart', (req, res) => {
  res.json({
    success: true,
    cart: {
      id: 'cart_123',
      items: [
        { product_id: 'P001', name: 'iPhone 15 Pro Max', price: 1799.99, quantity: 1 },
        { product_id: 'P002', name: 'Sofá Chesterfield', price: 4499.99, quantity: 1 }
      ],
      total: 6299.98,
      item_count: 2
    }
  });
});

// Order Routes
app.post('/russo/api/v1/orders/create', (req, res) => {
  const { items, shipping_address, payment_method } = req.body;
  
  res.json({
    success: true,
    order: {
      id: 'ORDER_' + Date.now(),
      number: 'RUSSO-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: items || [],
      total: 6299.98,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  });
});

// ==================== MANEJO DE ERRORES ====================

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    suggestion: `Verifica la URL. Backend disponible en: http://${LOCAL_IP}:${PORT}`
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Crear directorio de logs si no existe
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Log del error
  fs.appendFileSync(
    path.join(logDir, 'error.log'),
    `[${new Date().toISOString()}] ${err.stack || err.message}\n`
  );
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                  🚀 RUSSO BACKEND                    ║
╠═══════════════════════════════════════════════════════╣
║  Status:  ✅ ONLINE                                  ║
║  Port:    ${PORT.toString().padEnd(43)} ║
║  IP:      ${LOCAL_IP.padEnd(43)} ║
║  Mode:    ${process.env.NODE_ENV || 'development'.padEnd(43)} ║
╠═══════════════════════════════════════════════════════╣
║                 📍 ACCESO DESDE MÓVIL                ║
╠═══════════════════════════════════════════════════════╣
║  URL: http://${LOCAL_IP}:${PORT}                      ║
║  Health: http://${LOCAL_IP}:${PORT}/russo/health      ║
║  Config: http://${LOCAL_IP}:${PORT}/russo/config/mobile
╚═══════════════════════════════════════════════════════╝
  `);
  
  console.log('\n📱 Para configurar en la app móvil:');
  console.log('   1. Conecta a la misma red WiFi');
  console.log(`   2. Configura URL: http://${LOCAL_IP}:${PORT}`);
  console.log('   3. Presiona "Probar Conexión"');
  console.log('\n🛑 Presiona Ctrl+C para detener\n');
});
