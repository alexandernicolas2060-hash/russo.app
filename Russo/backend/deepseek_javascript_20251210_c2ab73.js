const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚙️  CONFIGURACIÓN INICIAL DE RUSSO');
console.log('==================================\n');

// Crear estructura de carpetas
const folders = [
  'routes',
  'config',
  'logs',
  'uploads',
  'data',
  'uploads/products',
  'uploads/users'
];

folders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Carpeta creada: ${folder}`);
  }
});

// Crear archivo .env
const envContent = `# CONFIGURACIÓN RUSSO
PORT=3001
NODE_ENV=production
APP_NAME=Russo
APP_URL=http://localhost:3001
APP_VERSION=1.0.0

# BASE DE DATOS
DB_PATH=./data/russo.db

# SEGURIDAD
JWT_SECRET=russo_secreto_jwt_2024_ultra_seguro
ENCRYPTION_KEY=russo_encryption_key_256bit_secure_2024
SESSION_SECRET=russo_session_secret_2024

# TWILIO (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_app

# APLICACIÓN
SUPPORT_EMAIL=soporte@russo.app
ADMIN_EMAIL=admin@russo.app
CONTACT_PHONE=+584141234567

# PRODUCTOS
MAX_PRODUCTS_PER_PAGE=20
MAX_UPLOAD_SIZE=104857600
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp,gif

# NOTIFICACIONES
PUSH_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true

# PAGOS (configurar después)
STRIPE_SECRET_KEY=sk_test_xxxx
PAYPAL_CLIENT_ID=xxxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx

# IDIOMAS
DEFAULT_LANGUAGE=es-VE
SUPPORTED_LANGUAGES=es-VE,es-ES,pt-BR,fr-FR,it-IT,de-DE,ja-JP,zh-CN,ru-RU,ar-SA,ko-KR

# TEMAS
DEFAULT_THEME=dark-luxe
AVAILABLE_THEMES=dark-luxe,black-diamond,platinum,midnight-gold,obsidian

# WIDGETS
WIDGETS_ENABLED=true
MAX_WIDGETS_PER_PAGE=15
WIDGET_UPDATE_INTERVAL=300000

# TASKS BACKGROUND
BACKGROUND_SYNC_INTERVAL=300000
CACHE_DURATION=3600000
LOG_RETENTION_DAYS=30
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('✅ Archivo .env creado');

// Crear configuración móvil
const mobileConfig = {
  "app": {
    "name": "Russo",
    "version": "1.0.0",
    "build": 1,
    "url": "http://localhost:3001",
    "support": "soporte@russo.app"
  },
  "api": {
    "baseUrl": "http://localhost:3001/api",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "features": {
    "widgets": true,
    "3dViewer": true,
    "offlineMode": true,
    "biometricAuth": true,
    "darkMode": true
  },
  "widgets": {
    "enabled": true,
    "refreshInterval": 300000,
    "maxWidgets": 15
  },
  "products": {
    "3dEnabled": true,
    "imageQuality": "high",
    "cacheEnabled": true
  },
  "theme": {
    "primary": "#0A0A0A",
    "secondary": "#D4AF37",
    "accent": "#F5F5F5",
    "background": "#0A0A0A",
    "surface": "#1A1A1A",
    "text": "#F5F5F5"
  }
};

fs.writeFileSync(
  path.join(__dirname, 'config/mobile-config.json'),
  JSON.stringify(mobileConfig, null, 2)
);
console.log('✅ Configuración móvil creada');

// Crear base de datos inicial
const db = require('./config/database');

console.log('\n🎉 CONFIGURACIÓN COMPLETADA');
console.log('==========================');
console.log('1. Instala dependencias:');
console.log('   cd backend && npm install');
console.log('\n2. Inicia el servidor:');
console.log('   npm start');
console.log('\n3. Para desarrollo:');
console.log('   npm run dev');
console.log('\n📱 La app estará disponible en: http://localhost:3001');
console.log('🔧 Configura tus variables en: backend/.env');

rl.close();