const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Crear carpetas necesarias
const folders = ['logs', 'uploads', 'data', 'config'];
folders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// Base de datos
const db = require('./config/database');

// Rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'Russo', 
    version: '1.0.0',
    message: 'Servidor funcionando correctamente'
  });
});

// Configuración móvil
app.get('/api/config/mobile', (req, res) => {
  const config = require('./config/mobile-config.json');
  res.json(config);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`⚡️ Servidor Russo ejecutándose en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📱 Configuración móvil: http://localhost:${PORT}/api/config/mobile`);
});