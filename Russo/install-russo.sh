#!/bin/bash
# Archivo: scripts/install-russo.sh

echo "=========================================="
echo "🚀 INSTALADOR AUTOMÁTICO RUSSO 🚀"
echo "=========================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar sistema
echo -e "${BLUE}🔍 Verificando sistema...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Instalando Node.js..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "msys" ]]; then
        # Windows (Git Bash)
        echo "Por favor instala Node.js desde: https://nodejs.org/"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# Crear estructura de directorios
echo -e "${BLUE}📁 Creando estructura de directorios...${NC}"

directories=(
    "backend"
    "backend/uploads"
    "backend/uploads/3d-models"
    "backend/uploads/products"
    "backend/logs"
    "backend/data"
    "backend/config"
    "backend/routes"
    "backend/models"
    "backend/services"
    "backend/utils"
    "mobile"
    "mobile/assets"
    "mobile/assets/fonts"
    "mobile/assets/images"
    "mobile/assets/animations"
    "mobile/assets/models3d"
    "mobile/src"
    "mobile/src/screens"
    "mobile/src/services"
    "mobile/src/components"
    "mobile/src/navigation"
    "mobile/src/utils"
    "mobile/src/widgets"
    "mobile/src/background"
    "scripts"
    "config"
    "docs"
    "admin-panel"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    echo -e "  📂 $dir"
done

echo -e "${GREEN}✅ Directorios creados${NC}"

# Crear archivos del backend
echo -e "${BLUE}📄 Creando archivos del backend...${NC}"

# Archivo principal del servidor
cat > backend/server.js << 'EOF'
// Código completo del servidor (como se mostró arriba)
// [Aquí va todo el código del server.js]
EOF

# setup.js
cat > backend/setup.js << 'EOF'
// Código de configuración automática
// [Aquí va todo el código del setup.js]
EOF

# routes/auth.js
cat > backend/routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/russo.db');

// Registro con teléfono
router.post('/register', (req, res) => {
    const { phone, country_code, password, name, lastname } = req.body;
    
    // Validaciones
    if (!phone || !password) {
        return res.status(400).json({ error: 'Teléfono y contraseña requeridos' });
    }
    
    // Verificar si el usuario ya existe
    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en base de datos' });
        }
        
        if (user) {
            return res.status(400).json({ error: 'El teléfono ya está registrado' });
        }
        
        // Generar código de verificación
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiry = new Date(Date.now() + 10 * 60000); // 10 minutos
        
        // Hash de contraseña
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        // Insertar usuario
        db.run(
            `INSERT INTO users 
            (phone, country_code, password, name, lastname, verification_code, verification_expiry) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [phone, country_code, passwordHash, name, lastname, verificationCode, verificationExpiry],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error registrando usuario' });
                }
                
                // En producción: enviar SMS con verificationCode
                console.log(`Código de verificación para ${phone}: ${verificationCode}`);
                
                res.json({
                    success: true,
                    message: 'Registro exitoso. Verifica tu teléfono.',
                    userId: this.lastID,
                    needsVerification: true
                });
            }
        );
    });
});

// Verificación SMS
router.post('/verify', (req, res) => {
    const { phone, code } = req.body;
    
    db.get(
        'SELECT * FROM users WHERE phone = ? AND verification_code = ? AND verification_expiry > ?',
        [phone, code, new Date()],
        (err, user) => {
            if (err || !user) {
                return res.status(400).json({ error: 'Código inválido o expirado' });
            }
            
            // Marcar como verificado
            db.run(
                'UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?',
                [user.id],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ error: 'Error actualizando usuario' });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Teléfono verificado exitosamente',
                        user: {
                            id: user.id,
                            phone: user.phone,
                            name: user.name,
                            lastname: user.lastname
                        }
                    });
                }
            );
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { phone, password } = req.body;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    db.get(
        'SELECT * FROM users WHERE phone = ? AND password = ? AND verified = 1',
        [phone, passwordHash],
        (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            
            // Generar token (simplificado)
            const token = crypto.randomBytes(32).toString('hex');
            
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    lastname: user.lastname,
                    theme: user.theme,
                    language: user.language
                }
            });
        }
    );
});

module.exports = router;
EOF

# Continuar con otros archivos del backend...
# [Aquí se crearían products.js, cart.js, orders.js, payments.js, admin.js]

echo -e "${GREEN}✅ Archivos del backend creados${NC}"

# Crear archivos móviles
echo -e "${BLUE}📱 Creando archivos móviles...${NC}"

# App.js principal
cat > mobile/App.js << 'EOF'
// Código principal de la app React Native
// [Aquí va todo el código del App.js mostrado arriba]
EOF

# package.json para móvil
cat > mobile/package.json << 'EOF'
{
  "name": "russo-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "expo build:android",
    "build:ios": "expo build:ios",
    "eject": "expo eject"
  },
  "dependencies": {
    "expo": "~48.0.0",
    "expo-splash-screen": "~0.18.2",
    "expo-status-bar": "~1.4.4",
    "expo-updates": "~0.16.4",
    "react": "18.2.0",
    "react-native": "0.71.8",
    "react-native-screens": "~3.20.0",
    "react-native-safe-area-context": "4.5.0",
    "react-native-gesture-handler": "~2.9.0",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/stack": "^6.3.17",
    "@react-native-async-storage/async-storage": "1.18.2",
    "react-native-reanimated": "~2.14.4",
    "@expo/vector-icons": "^13.0.0",
    "lottie-react-native": "5.1.6",
    "react-native-3d-model-view": "^1.2.0",
    "react-native-background-task": "^0.2.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

# Continuar con otros archivos móviles...
# [Aquí se crearían todas las pantallas, componentes, servicios, etc.]

echo -e "${GREEN}✅ Archivos móviles creados${NC}"

# Crear scripts
echo -e "${BLUE}📜 Creando scripts de ejecución...${NC}"

# Script Windows
cat > scripts/start-russo.bat << 'EOF'
@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo    🚀 INICIANDO RUSSO - APLICACIÓN DE LUJO
echo ==========================================
echo.

cd backend

if not exist node_modules (
    echo 📦 Instalando dependencias del backend...
    call npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo ⚡ Iniciando servidor backend...
echo 🌐 URL: http://localhost:3000
echo 📱 Móvil: http://192.168.1.X:3000
echo.

start cmd /k "node server.js"

echo ✅ Backend iniciado
echo.
echo 📱 Para iniciar la app móvil:
echo 1. Abre otra terminal
echo 2. cd mobile
echo 3. npm start
echo.

pause
EOF

# Script Linux/Mac
cat > scripts/start-russo.sh << 'EOF'
#!/bin/bash

clear
echo "=========================================="
echo "🚀 INICIANDO RUSSO - APLICACIÓN DE LUJO"
echo "=========================================="
echo ""

cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
fi

echo "⚡ Iniciando servidor backend..."
echo "🌐 URL: http://localhost:3000"
echo "📱 Móvil: http://$(ipconfig getifaddr en0):3000"
echo ""

# Iniciar en background
node server.js &

BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"
echo ""
echo "📱 Para iniciar la app móvil:"
echo "1. Abre otra terminal"
echo "2. cd mobile"
echo "3. npm start"
echo ""
echo "🛑 Para detener: kill $BACKEND_PID"
echo ""

wait $BACKEND_PID
EOF

chmod +x scripts/start-russo.sh

# Script para construir APK
cat > scripts/build-apk.sh << 'EOF'
#!/bin/bash

echo "🔨 CONSTRUYENDO APK DE RUSSO"
echo "=============================="

cd mobile

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No se encuentra package.json en mobile/"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install

echo "🏗️  Construyendo APK..."
expo build:android

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 APK construido exitosamente!"
    echo "📥 Descarga desde: https://expo.dev/accounts/[tu-usuario]/projects/russo/builds"
    echo ""
    echo "🔑 Recuerda:"
    echo "1. Esta es una build de desarrollo"
    echo "2. Para producción necesitarás keystore"
    echo "3. Configura app.json con tu información"
else
    echo "❌ Error construyendo APK"
    exit 1
fi
EOF

chmod +x scripts/build-apk.sh

echo -e "${GREEN}✅ Scripts creados${NC}"

# Crear documentación
echo -e "${BLUE}📚 Creando documentación...${NC}"

cat > docs/SETUP.md << 'EOF'
# 🚀 GUÍA DE INSTALACIÓN RUSSO

## Requisitos Previos
- Node.js 16+ 
- npm 8+
- Expo CLI (opcional)
- Git

## Instalación Rápida

### 1. Clonar o extraer proyecto
```bash
unzip russo.zip
cd russo
