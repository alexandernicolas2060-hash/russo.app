const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');
const publicIp = require('public-ip');

console.log(`
╔══════════════════════════════════════════╗
║         🚀 CONFIGURACIÓN RUSSO          ║
╚══════════════════════════════════════════╝
`);

// Obtener IP local
function getLocalIP() {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }

  return results[0] || 'localhost';
}

// Crear estructura de directorios
function createDirectories() {
  const dirs = [
    'config',
    'logs',
    'uploads',
    'data',
    'routes'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Directorio creado: ${dir}`);
    }
  });
}

// Crear archivo .env
async function createEnvFile() {
  const localIP = getLocalIP();
  const publicIP = await publicIp.v4().catch(() => null);
  
  const envContent = `
# RUSSO BACKEND CONFIGURATION
NODE_ENV=development
PORT=3000

# Network
LOCAL_IP=${localIP}
PUBLIC_IP=${publicIP || 'NOT_AVAILABLE'}
BASE_URL=http://${localIP}:3000
API_URL=http://${localIP}:3000/russo/api/v1

# Security
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${require('crypto').randomBytes(32).toString('hex')}

# Database
DB_PATH=./data/russo.db

# Features
ENABLE_UPLOADS=true
MAX_UPLOAD_SIZE=50mb
ENABLE_LOGGING=true
`;
  
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('✅ Archivo .env creado');
  
  return { localIP, publicIP };
}

// Crear configuración para móvil
function createMobileConfig(localIP) {
  const config = {
    backend: {
      url: `http://${localIP}:3000`,
      endpoints: {
        api: `http://${localIP}:3000/russo/api/v1`,
        health: `http://${localIP}:3000/russo/health`,
        auth: `http://${localIP}:3000/russo/api/v1/auth`,
        products: `http://${localIP}:3000/russo/api/v1/products`
      }
    },
    detected_at: new Date().toISOString(),
    version: "1.0.0"
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'config', 'mobile-config.json'),
    JSON.stringify(config, null, 2)
  );
  console.log('✅ Configuración móvil creada');
}

// Crear base de datos SQLite
function createDatabase() {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./data/russo.db');
  
  db.serialize(() => {
    // Usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Productos
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Carrito
    db.run(`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insertar productos de ejemplo
    const products = [
      ['P001', 'iPhone 15 Pro Max', 'Smartphone premium Apple', 1799.99, 'Tecnología', '', 10, 1],
      ['P002', 'Sofá Chesterfield', 'Sofá de cuero italiano', 4499.99, 'Muebles', '', 3, 1],
      ['P003', 'Reloj Cartier', 'Reloj de lujo automático', 12499.99, 'Joyas', '', 1, 1],
      ['P004', 'Vestido Dior', 'Vestido alta costura', 8899.99, 'Moda', '', 5, 0]
    ];
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO products 
      (id, name, description, price, category, image_url, stock, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    products.forEach(product => stmt.run(product));
    stmt.finalize();
    
    console.log('✅ Base de datos creada con productos de ejemplo');
  });
  
  db.close();
}

// Mostrar información de conexión
function showConnectionInfo(localIP) {
  console.log(`
╔══════════════════════════════════════════╗
║         📡 INFORMACIÓN DE CONEXIÓN      ║
╚══════════════════════════════════════════╝

✅ CONFIGURACIÓN COMPLETADA

📍 IP Local: ${localIP}
🔌 Puerto: 3000
📁 Base de datos: data/russo.db

🔗 URLs importantes:
   • Backend: http://${localIP}:3000
   • Health: http://${localIP}:3000/russo/health
   • API: http://${localIP}:3000/russo/api/v1

📱 Para configurar en la app móvil:
   1. Conecta el teléfono a la MISMA red WiFi
   2. En la app, ve a Configuración
   3. Ingresa esta URL: http://${localIP}:3000
   4. Presiona "Probar Conexión"

🚀 Para iniciar el backend:
   $ cd backend
   $ npm start

💡 Si cambias de red WiFi, ejecuta:
   $ npm run setup
`);
  
  // Crear archivo de acceso rápido
  const accessInfo = `
RUSSO BACKEND - ACCESO RÁPIDO
==============================

URL Backend: http://${localIP}:3000
Health Check: http://${localIP}:3000/russo/health

Para configurar en móvil:
1. Misma red WiFi
2. URL: http://${localIP}:3000
3. Probar conexión

Comando inicio: npm start
`;
  
  fs.writeFileSync(path.join(__dirname, 'ACCESS.txt'), accessInfo);
  console.log('📄 Archivo de acceso creado: ACCESS.txt');
}

// Función principal
async function main() {
  try {
    console.log('🔧 Configurando Russo Backend...\n');
    
    createDirectories();
    const { localIP } = await createEnvFile();
    createMobileConfig(localIP);
    createDatabase();
    showConnectionInfo(localIP);
    
    console.log('\n🎉 ¡Configuración completada!');
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { getLocalIP };
