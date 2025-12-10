#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🛠️  CONFIGURADOR RUSSO v1.0.0              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

// Función para preguntas
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Función para generar clave secreta
function generateSecretKey() {
    return crypto.randomBytes(64).toString('hex');
}

// Función para crear directorios
function createDirectories() {
    const dirs = [
        'backend/logs',
        'backend/uploads/products',
        'backend/uploads/models3d',
        'backend/uploads/avatars',
        'backend/data',
        'backend/config',
        'backend/routes',
        'backend/models',
        'backend/middleware',
        'backend/controllers',
        'backend/utils',
        'mobile/assets/fonts',
        'mobile/assets/images/logo',
        'mobile/assets/images/icons',
        'mobile/assets/animations',
        'mobile/src/screens',
        'mobile/src/services/api',
        'mobile/src/services/storage',
        'mobile/src/services/background',
        'mobile/src/components/common',
        'mobile/src/components/product',
        'mobile/src/components/cart',
        'mobile/src/components/widgets',
        'mobile/src/components/navigation',
        'mobile/src/navigation',
        'mobile/src/utils',
        'mobile/src/hooks',
        'mobile/src/context',
        'mobile/src/i18n',
        'scripts',
        'config/legal',
        'docs'
    ];

    console.log('📁 Creando estructura de directorios...');
    
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`  ✅ ${dir}`);
        }
    });
}

// Función para crear archivo .env
async function createEnvFile() {
    console.log('\n🔧 Configurando variables de entorno...');
    
    const answers = {
        port: await askQuestion('  Puerto del servidor (3000): ') || '3000',
        nodeEnv: await askQuestion('  Entorno (development/production): ') || 'development',
        dbPath: await askQuestion('  Ruta de base de datos (backend/data/russo.db): ') || 'backend/data/russo.db',
        jwtSecret: generateSecretKey(),
        sessionSecret: generateSecretKey(),
        adminPhone: await askQuestion('  Teléfono de administrador (+584141234567): ') || '+584141234567',
        smsProvider: await askQuestion('  Proveedor SMS (twilio/nexmo): ') || 'twilio'
    };

    // Preguntar por credenciales SMS si se selecciona Twilio
    let smsConfig = '';
    if (answers.smsProvider === 'twilio') {
        console.log('\n  📱 Configuración de Twilio:');
        const twilioAccountSid = await askQuestion('    Account SID: ');
        const twilioAuthToken = await askQuestion('    Auth Token: ');
        const twilioPhoneNumber = await askQuestion('    Número Twilio (+1234567890): ');
        
        smsConfig = `
TWILIO_ACCOUNT_SID=${twilioAccountSid}
TWILIO_AUTH_TOKEN=${twilioAuthToken}
TWILIO_PHONE_NUMBER=${twilioPhoneNumber}
`;
    }

    const envContent = `
# SERVIDOR
PORT=${answers.port}
NODE_ENV=${answers.nodeEnv}

# BASE DE DATOS
DB_TYPE=sqlite
DB_PATH=${answers.dbPath}

# SEGURIDAD
JWT_SECRET=${answers.jwtSecret}
SESSION_SECRET=${answers.sessionSecret}
JWT_EXPIRES_IN=7d

# ADMINISTRADOR
ADMIN_PHONE=${answers.adminPhone}
ADMIN_EMAIL=admin@russo.com

# SMS VERIFICATION
SMS_PROVIDER=${answers.smsProvider}
SMS_VERIFICATION_ENABLED=true
${smsConfig}

# PAGOS
PAYMENT_METHOD=direct
CURRENCY=USD

# SUBIDA DE ARCHIVOS
MAX_FILE_SIZE=50MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
ALLOWED_3D_TYPES=glb,gltf,obj,usdz

# CORS
ALLOWED_ORIGINS=*

# LOGGING
LOG_LEVEL=info
LOG_TO_FILE=true

# WIDGETS
WIDGETS_ENABLED=true
MAX_WIDGETS_PER_USER=15

# PRODUCTOS 3D
ENABLE_3D_VIEWER=true
AUTO_GENERATE_THUMBNAILS=true

# CACHÉ
CACHE_ENABLED=true
CACHE_DURATION=3600

# NOTIFICACIONES
PUSH_NOTIFICATIONS_ENABLED=true
`;

    const envPath = path.join(__dirname, 'backend', '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`  ✅ Archivo .env creado en: ${envPath}`);
    
    return answers;
}

// Función para crear package.json del backend
function createBackendPackageJson() {
    const packageJson = {
        name: "russo-backend",
        version: "1.0.0",
        description: "Backend exclusivo para la aplicación Russo",
        main: "server.js",
        scripts: {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "setup": "node setup.js",
            "migrate": "node scripts/migrate.js",
            "seed": "node scripts/seed.js",
            "test": "jest",
            "lint": "eslint .",
            "backup": "node scripts/backup.js"
        },
        "keywords": ["russo", "ecommerce", "luxury", "exclusive"],
        "author": "Russo Inc.",
        "license": "PROPRIETARY",
        "dependencies": {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "helmet": "^7.0.0",
            "morgan": "^1.10.0",
            "compression": "^1.7.4",
            "dotenv": "^16.0.3",
            "sqlite3": "^5.1.6",
            "jsonwebtoken": "^9.0.0",
            "bcryptjs": "^2.4.3",
            "express-rate-limit": "^6.7.0",
            "multer": "^1.4.5-lts.1",
            "sharp": "^0.32.0",
            "twilio": "^4.11.0",
            "axios": "^1.4.0",
            "moment": "^2.29.4",
            "winston": "^3.9.0",
            "uuid": "^9.0.0"
        },
        "devDependencies": {
            "nodemon": "^2.0.22",
            "jest": "^29.5.0",
            "supertest": "^6.3.3",
            "eslint": "^8.42.0"
        },
        "engines": {
            "node": ">=16.0.0"
        },
        "private": true
    };

    const packagePath = path.join(__dirname, 'backend', 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log(`  ✅ package.json creado en: ${packagePath}`);
}

// Función para crear configuración móvil
function createMobileConfig() {
    const mobileConfig = {
        app: {
            name: "Russo",
            version: "1.0.0",
            buildNumber: 1,
            minVersion: "1.0.0"
        },
        api: {
            baseUrl: "http://localhost:3000/api",
            timeout: 30000,
            retryAttempts: 3
        },
        features: {
            widgets: {
                enabled: true,
                count: 15,
                refreshInterval: 300000
            },
            threeD: {
                enabled: true,
                autoRotate: true,
                enableZoom: true,
                quality: "high"
            },
            offline: {
                enabled: true,
                cacheDuration: 604800000,
                syncInterval: 300000
            },
            notifications: {
                enabled: true,
                types: ["new_products", "order_updates", "promotions"]
            }
        },
        design: {
            theme: "dark_elegant",
            animationSpeed: "fast",
            borderRadius: 12,
            spacing: {
                small: 8,
                medium: 16,
                large: 24,
                xlarge: 32
            },
            typography: {
                fontFamily: "ElegantSans",
                fontSize: {
                    small: 12,
                    medium: 14,
                    large: 18,
                    xlarge: 24,
                    xxlarge: 32
                }
            },
            colors: {
                primary: "#0A0A0A",
                secondary: "#D4AF37",
                accent: "#2C2C2C",
                background: "#0F0F0F",
                surface: "#1A1A1A",
                text: "#F5F5F5",
                textSecondary: "#B0B0B0",
                success: "#28A745",
                error: "#DC3545",
                warning: "#FFC107"
            }
        },
        legal: {
            termsUrl: "/api/legal/terms",
            privacyUrl: "/api/legal/privacy",
            requiredAge: 16
        }
    };

    const configPath = path.join(__dirname, 'backend', 'config', 'mobile-config.json');
    fs.writeFileSync(configPath, JSON.stringify(mobileConfig, null, 2));
    console.log(`  ✅ mobile-config.json creado en: ${configPath}`);
}

// Función para crear scripts de inicio
function createStartScripts() {
    // Script para Windows
    const batScript = `@echo off
echo Iniciando Servidor Russo...
echo.

cd backend
if not exist node_modules (
    echo Instalando dependencias...
    npm install
    echo Dependencias instaladas.
    echo.
)

echo Iniciando servidor...
npm start

pause`;

    const batPath = path.join(__dirname, '..', 'scripts', 'start-russo.bat');
    fs.writeFileSync(batPath, batScript);
    console.log(`  ✅ Script Windows creado: scripts/start-russo.bat`);

    // Script para Linux/Mac
    const shScript = `#!/bin/bash

echo "🚀 Iniciando Servidor Russo..."
echo ""

cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo "✅ Dependencias instaladas."
    echo ""
fi

echo "🌐 Iniciando servidor..."
echo "📡 Servidor disponible en: http://localhost:3000"
echo "📱 Configuración móvil: http://localhost:3000/api/config/mobile"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

npm start`;

    const shPath = path.join(__dirname, '..', 'scripts', 'start-russo.sh');
    fs.writeFileSync(shPath, shScript);
    fs.chmodSync(shPath, '755');
    console.log(`  ✅ Script Linux/Mac creado: scripts/start-russo.sh`);

    // Script para construir APK
    const buildScript = `#!/bin/bash

echo "🔨 Construyendo APK de Russo..."
echo ""

cd mobile

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de React Native..."
    npm install
    echo "✅ Dependencias instaladas."
    echo ""
fi

# Verificar si Android SDK está configurado
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ADVERTENCIA: ANDROID_HOME no está configurado"
    echo "Configura ANDROID_HOME en tu entorno o instala Android Studio"
    exit 1
fi

# Crear bundle
echo "📦 Creando bundle JavaScript..."
npx react-native bundle --platform android --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res/

# Construir APK
echo "🔨 Construyendo APK..."
cd android
./gradlew assembleRelease

echo ""
echo "✅ APK construido exitosamente!"
echo "📁 APK generado en: mobile/android/app/build/outputs/apk/release/"
echo ""
echo "Para instalar en dispositivo:"
echo "adb install mobile/android/app/build/outputs/apk/release/app-release.apk"`;

    const buildPath = path.join(__dirname, '..', 'scripts', 'build-apk.sh');
    fs.writeFileSync(buildPath, buildScript);
    fs.chmodSync(buildPath, '755');
    console.log(`  ✅ Script de build creado: scripts/build-apk.sh`);
}

// Función principal
async function main() {
    try {
        console.log('🛠️  Iniciando configuración de Russo...\n');
        
        // 1. Crear directorios
        createDirectories();
        
        // 2. Crear archivos de configuración
        await createEnvFile();
        createBackendPackageJson();
        createMobileConfig();
        createStartScripts();
        
        // 3. Crear archivos legales
        createLegalDocuments();
        
        // 4. Crear README
        createReadme();
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('='.repeat(60));
        console.log('\n📋 Pasos siguientes:');
        console.log('1. cd backend');
        console.log('2. npm install');
        console.log('3. npm start');
        console.log('\n📱 Para la app móvil:');
        console.log('1. cd mobile');
        console.log('2. npm install');
        console.log('3. npx react-native run-android (o run-ios)');
        console.log('\n⚡ Para ejecutar rápidamente:');
        console.log('• Windows: doble click en scripts/start-russo.bat');
        console.log('• Mac/Linux: ./scripts/start-russo.sh');
        console.log('\n🔒 Recuerda configurar:');
        console.log('• Credenciales de Twilio en backend/.env');
        console.log('• Certificados de notificaciones push');
        console.log('• Claves de API para pagos');
        
    } catch (error) {
        console.error('❌ Error durante la configuración:', error);
    } finally {
        rl.close();
    }
}

// Ejecutar configuración
main();
