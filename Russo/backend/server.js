const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Importar configuraciones
const { connectDatabase } = require('./config/database');
const { setupDirectories } = require('./utils/init');
const { logToFile } = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const widgetRoutes = require('./routes/widgets');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');

// Inicializar aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crear directorios necesarios
setupDirectories();

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
    message: 'Demasiadas solicitudes desde esta IP'
});
app.use('/api/', limiter);

// Middlewares
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(compression());
app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Russo Backend',
        version: '1.0.0'
    });
});

// Ruta para configuración móvil
app.get('/api/config/mobile', (req, res) => {
    const config = require('./config/mobile-config.json');
    res.json(config);
});

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    logToFile('error', err.message, err.stack);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Conectar a base de datos e iniciar servidor
async function startServer() {
    try {
        await connectDatabase();
        
        app.listen(PORT, () => {
            console.log(`
            🚀 Servidor Russo iniciado exitosamente!
            
            ██████╗ ██╗   ██╗███████╗███████╗ ██████╗ 
            ██╔══██╗██║   ██║██╔════╝██╔════╝██╔═══██╗
            ██████╔╝██║   ██║███████╗███████╗██║   ██║
            ██╔══██╗██║   ██║╚════██║╚════██║██║   ██║
            ██║  ██║╚██████╔╝███████║███████║╚██████╔╝
            ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ 
            
            🔗 URL: http://localhost:${PORT}
            📁 Entorno: ${process.env.NODE_ENV || 'development'}
            🗄️  Base de datos: Conectada
            📊 Logs: backend/logs/
            ⚙️  Config: backend/config/
            
            Rutas disponibles:
            • POST /api/auth/register - Registro por teléfono
            • GET /api/products/latest - Últimos productos
            • GET /api/widgets/all - Todos los widgets
            • POST /api/cart/checkout - Finalizar compra
            
            Presiona Ctrl+C para detener el servidor
            `);
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre elegante
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT. Cerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
