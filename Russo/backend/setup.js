const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 CONFIGURACIÓN AUTOMÁTICA RUSSO 🔧\n');

// Crear estructura de directorios
const directories = [
    'backend/uploads',
    'backend/uploads/3d-models',
    'backend/uploads/products',
    'backend/logs',
    'backend/data',
    'backend/config',
    'mobile/assets/fonts',
    'mobile/assets/images',
    'mobile/assets/animations',
    'mobile/assets/models3d',
    'scripts',
    'config',
    'docs'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Creado: ${dir}`);
    }
});

// Crear archivo .env
const envContent = `# RUSSO CONFIGURATION
PORT=3000
NODE_ENV=development
APP_NAME=Russo
APP_VERSION=1.0.0

# DATABASE
DB_PATH=./data/russo.db

# SECURITY
JWT_SECRET=RussoSuperSecretKey2024
ENCRYPTION_KEY=RussoEncryptionKey2024

# SMS VERIFICATION (Simulado)
SMS_API_KEY=simulated
SMS_API_SECRET=simulated

# PAYMENT (Sistema Directo)
ENABLE_DIRECT_PAYMENTS=true
DEFAULT_CURRENCY=USD

# NOTIFICATIONS
ENABLE_PUSH_NOTIFICATIONS=true

# 3D MODELS
MAX_MODEL_SIZE_MB=50
ALLOWED_3D_FORMATS=glb,gltf,obj

# LEGAL
COMPANY_NAME=Russo
COMPANY_COUNTRY=Venezuela
COMPANY_EMAIL=legal@russo.com

# THEMES
DEFAULT_THEME=dark_gold
AVAILABLE_THEMES=dark_gold,black_platinum,midnight_blue,emerald_green,ruby_red,sapphire_blue

# WIDGETS
MAX_WIDGETS_PER_USER=15
WIDGET_UPDATE_INTERVAL=300000

# PRODUCTS
DEFAULT_PRODUCTS_PER_PAGE=10
FEATURED_PRODUCTS_LIMIT=5

# CACHE
CACHE_DURATION=3600000
`;

fs.writeFileSync('backend/.env', envContent);
console.log('✅ Archivo .env creado');

// Crear configuración móvil
const mobileConfig = {
    app_name: "Russo",
    version: "1.0.0",
    api_url: "http://localhost:3000",
    features: {
        background_service: true,
        widgets: true,
        offline_mode: true,
        voice_search: true,
        image_search: true,
        ar_view: true
    },
    themes: {
        dark_gold: {
            primary: "#0A0A0A",
            secondary: "#D4AF37",
            accent: "#F5F5F5",
            text: "#FFFFFF",
            background: "#121212"
        },
        black_platinum: {
            primary: "#000000",
            secondary: "#E5E4E2",
            accent: "#8A8D8F",
            text: "#FFFFFF",
            background: "#0D0D0D"
        },
        midnight_blue: {
            primary: "#0F1931",
            secondary: "#4A6FA5",
            accent: "#9BB3D4",
            text: "#FFFFFF",
            background: "#1A2844"
        }
    },
    animations: {
        logo_transition: 800,
        menu_open: 300,
        product_zoom: 200,
        theme_switch: 400
    },
    legal: {
        terms_url: "/api/legal/terms",
        privacy_url: "/api/legal/privacy",
        minimum_age: 16
    }
};

fs.writeFileSync('backend/config/mobile-config.json', JSON.stringify(mobileConfig, null, 2));
console.log('✅ Configuración móvil creada');

// Crear archivo de términos legales
const legalTerms = {
    disclaimer: "ESTOS TÉRMINOS PROTEGEN A RUSSO COMPLETAMENTE",
    sections: [
        {
            title: "ACEPTACIÓN INCONDICIONAL",
            content: "Al usar Russo, aceptas que:\n1. No puedes demandar a Russo\n2. Russo no es responsable de nada\n3. Las compras son finales\n4. Aceptas la jurisdicción de Venezuela"
        },
        {
            title: "PROTECCIÓN LEGAL ABSOLUTA",
            content: "Russo está protegido por:\n1. Leyes de Propiedad Intelectual de Venezuela\n2. Tratados internacionales de comercio\n3. Cláusulas de arbitraje obligatorio\n4. Renuncia a acciones colectivas"
        },
        {
            title: "GANANCIAS 100% PROTEGIDAS",
            content: "Todas las ganancias:\n1. Pertenecen exclusivamente a Russo\n2. No están sujetas a comisiones\n3. No pueden ser embargadas\n4. Transferencia directa al propietario"
        },
        {
            title: "IRREVOCABILIDAD",
            content: "Estos términos no pueden ser modificados por:\n1. Usuarios\n2. Gobierno\n3. Cortes internacionales\n4. Cualquier tercera parte"
        }
    ]
};

fs.writeFileSync('config/legal-terms.json', JSON.stringify(legalTerms, null, 2));
console.log('✅ Términos legales creados');

// Script de inicio para Windows
const batScript = `@echo off
echo Iniciando RUSSO - Aplicacion de Lujo
echo ====================================

cd backend
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)

echo Iniciando servidor...
node server.js

pause`;

fs.writeFileSync('scripts/start-russo.bat', batScript);
console.log('✅ Script Windows creado');

// Script de inicio para Linux/Mac
const shScript = `#!/bin/bash
echo "🚀 Iniciando RUSSO - Aplicación de Lujo"
echo "========================================"

cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo "⚡ Iniciando servidor..."
node server.js`;

fs.writeFileSync('scripts/start-russo.sh', shScript);
fs.chmodSync('scripts/start-russo.sh', '755');
console.log('✅ Script Linux/Mac creado');

// Crear package.json para backend
const backendPackage = {
    name: "russo-backend",
    version: "1.0.0",
    description: "Backend exclusivo para Russo - Aplicación de lujo",
    main: "server.js",
    scripts: {
        "start": "node server.js",
        "setup": "node setup.js",
        "dev": "nodemon server.js"
    },
    dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "sqlite3": "^5.1.6",
        "dotenv": "^16.0.3",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.0",
        "multer": "^1.4.5-lts.1",
        "sharp": "^0.32.1",
        "crypto-js": "^4.1.1"
    },
    devDependencies: {
        "nodemon": "^2.0.22"
    }
};

fs.writeFileSync('backend/package.json', JSON.stringify(backendPackage, null, 2));
console.log('✅ Package.json backend creado');

console.log('\n🎉 CONFIGURACIÓN COMPLETADA 🎉');
console.log('\nSiguientes pasos:');
console.log('1. cd backend');
console.log('2. npm install');
console.log('3. npm start');
console.log('\nO ejecuta:');
console.log('   Windows: scripts/start-russo.bat');
console.log('   Mac/Linux: ./scripts/start-russo.sh');

rl.close();
