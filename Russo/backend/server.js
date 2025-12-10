const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuración automática
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/3d-models', express.static(path.join(__dirname, 'uploads/3d-models')));

// Base de datos
const db = new sqlite3.Database('./data/russo.db');

// Crear tablas si no existen
const initDatabase = () => {
    db.serialize(() => {
        // Usuarios
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            country_code TEXT NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            lastname TEXT,
            verified INTEGER DEFAULT 0,
            verification_code TEXT,
            verification_expiry DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            theme TEXT DEFAULT 'dark_gold',
            language TEXT DEFAULT 'es_VE',
            wallet_balance REAL DEFAULT 0
        )`);

        // Productos
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT,
            subcategory TEXT,
            gender TEXT,
            image_url TEXT,
            model_3d_url TEXT,
            stock INTEGER DEFAULT 0,
            featured INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Carrito
        db.run(`CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Órdenes
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_number TEXT UNIQUE NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            shipping_address TEXT,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Widgets personalizados
        db.run(`CREATE TABLE IF NOT EXISTS user_widgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            widget_type TEXT NOT NULL,
            widget_config TEXT,
            position INTEGER,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Transacciones de pago directo
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_id INTEGER,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            method TEXT,
            status TEXT DEFAULT 'pending',
            transaction_hash TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )`);

        console.log('✅ Base de datos inicializada');
    });
};

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Ruta para términos legales
app.get('/api/legal/terms', (req, res) => {
    const terms = {
        v1: "1.0",
        last_updated: new Date().toISOString(),
        sections: {
            acceptance: "Al usar Russo, aceptas estos términos. Si no estás de acuerdo, no uses la app.",
            eligibility: "Debes tener al menos 16 años para usar Russo.",
            account: "Eres responsable de tu cuenta y su seguridad.",
            purchases: "Las compras son finales. No hay reembolsos excepto por fallas del producto.",
            pricing: "Los precios pueden cambiar. El precio final es el mostrado al pagar.",
            shipping: "Los tiempos de envío varían. No somos responsables de retrasos de terceros.",
            intellectual_property: "Todo el contenido de Russo está protegido. No copies nada.",
            limitations: "No uses Russo para actividades ilegales.",
            termination: "Podemos suspender tu cuenta si violas estos términos.",
            governing_law: "Estos términos se rigen por las leyes de Venezuela.",
            changes: "Podemos cambiar estos términos. Te notificaremos de cambios importantes.",
            contact: "Para preguntas legales: legal@russo.com"
        }
    };
    res.json(terms);
});

// Ruta para política de privacidad
app.get('/api/legal/privacy', (req, res) => {
    const privacy = {
        data_collected: [
            "Número de teléfono para registro",
            "Nombre y apellido (opcional)",
            "Dirección de envío",
            "Historial de compras",
            "Preferencias de widget"
        ],
        data_usage: "Solo usamos tus datos para operar Russo. No vendemos datos.",
        data_protection: "Encriptamos todos los datos sensibles.",
        your_rights: [
            "Puedes ver tus datos",
            "Puedes solicitar eliminación",
            "Puedes exportar tus datos"
        ],
        cookies: "No usamos cookies de seguimiento.",
        children: "No recolectamos datos de menores de 16 años.",
        changes: "Te notificaremos cambios en esta política."
    };
    res.json(privacy);
});

// Servidor de archivos para modelos 3D
app.get('/api/3d/:modelId', (req, res) => {
    const modelId = req.params.modelId;
    const modelPath = path.join(__dirname, 'uploads/3d-models', `${modelId}.glb`);
    
    if (fs.existsSync(modelPath)) {
        res.sendFile(modelPath);
    } else {
        res.status(404).json({ error: 'Modelo 3D no encontrado' });
    }
});

// Endpoint para widgets
app.get('/api/widgets/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(
        'SELECT * FROM user_widgets WHERE user_id = ? AND is_active = 1 ORDER BY position',
        [userId],
        (err, widgets) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Widgets por defecto si no tiene configurados
            if (widgets.length === 0) {
                widgets = [
                    { widget_type: 'featured_product', position: 0 },
                    { widget_type: 'recent_products', position: 1 },
                    { widget_type: 'quick_cart', position: 2 },
                    { widget_type: 'notifications', position: 3 },
                    { widget_type: 'order_status', position: 4 }
                ];
            }
            
            res.json({ widgets });
        }
    );
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor Russo iniciado en http://${HOST}:${PORT}`);
    console.log(`📱 Endpoint móvil: http://${getLocalIp()}:${PORT}`);
    console.log(`⚖️  Términos legales: http://${getLocalIp()}:${PORT}/api/legal/terms`);
    initDatabase();
});

function getLocalIp() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
