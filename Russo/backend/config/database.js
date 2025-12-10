const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'russo.db');
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Asegurar que el directorio existe
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error al conectar con la base de datos:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conectado a la base de datos SQLite');
                    this.initializeDatabase()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async initializeDatabase() {
        try {
            await this.run('PRAGMA foreign_keys = ON');
            await this.run('PRAGMA journal_mode = WAL');
            await this.run('PRAGMA synchronous = NORMAL');
            await this.run('PRAGMA cache_size = -2000'); // 2MB cache
            
            await this.createTables();
            await this.createIndexes();
            await this.seedInitialData();
            
            console.log('✅ Base de datos inicializada correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar base de datos:', error);
            throw error;
        }
    }

    async createTables() {
        // Tabla de usuarios
        await this.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                country_code VARCHAR(4) NOT NULL,
                verification_code VARCHAR(6),
                verification_sent_at DATETIME,
                verified BOOLEAN DEFAULT 0,
                verified_at DATETIME,
                reset_password_code VARCHAR(6),
                reset_password_expires DATETIME,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                is_admin BOOLEAN DEFAULT 0
            )
        `);

        // Tabla de productos
        await this.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                short_description TEXT,
                price DECIMAL(10,2) NOT NULL,
                compare_price DECIMAL(10,2),
                cost DECIMAL(10,2),
                category_id INTEGER,
                subcategory_id INTEGER,
                brand VARCHAR(100),
                model VARCHAR(100),
                color VARCHAR(50),
                size VARCHAR(50),
                weight DECIMAL(8,3),
                dimensions VARCHAR(100),
                material VARCHAR(100),
                origin_country VARCHAR(100),
                stock_quantity INTEGER DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 5,
                is_active BOOLEAN DEFAULT 1,
                is_featured BOOLEAN DEFAULT 0,
                is_new BOOLEAN DEFAULT 1,
                is_3d_available BOOLEAN DEFAULT 0,
                views_count INTEGER DEFAULT 0,
                sales_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                rating_count INTEGER DEFAULT 0,
                main_image_url TEXT,
                image_urls TEXT, -- JSON array de imágenes
                model_3d_url TEXT,
                model_3d_thumbnail TEXT,
                tags TEXT, -- JSON array de tags
                specifications TEXT, -- JSON de especificaciones
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                published_at DATETIME,
                created_by INTEGER,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

        // Tabla de categorías
        await this.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                image_url TEXT,
                parent_id INTEGER,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES categories(id)
            )
        `);

        // Tabla de subcategorías
        await this.run(`
            CREATE TABLE IF NOT EXISTS subcategories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                image_url TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `);

        // Tabla de carrito
        await this.run(`
            CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id VARCHAR(100),
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                price DECIMAL(10,2) NOT NULL,
                options TEXT, -- JSON de opciones seleccionadas
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                UNIQUE(user_id, product_id, session_id)
            )
        `);

        // Tabla de órdenes
        await this.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                total_amount DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                shipping_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                currency VARCHAR(3) DEFAULT 'USD',
                shipping_address TEXT, -- JSON
                billing_address TEXT, -- JSON
                shipping_method VARCHAR(100),
                payment_method VARCHAR(100),
                payment_status VARCHAR(50) DEFAULT 'pending',
                transaction_id VARCHAR(100),
                notes TEXT,
                estimated_delivery DATE,
                delivered_at DATETIME,
                cancelled_at DATETIME,
                refunded_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Tabla de items de orden
        await this.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name VARCHAR(200) NOT NULL,
                product_sku VARCHAR(50) NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                options TEXT, -- JSON
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // Tabla de widgets
        await this.run(`
            CREATE TABLE IF NOT EXISTS widgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                size VARCHAR(20) DEFAULT 'medium',
                is_active BOOLEAN DEFAULT 1,
                display_order INTEGER DEFAULT 0,
                configuration TEXT, -- JSON config
                data_source TEXT, -- API endpoint o query
                refresh_interval INTEGER DEFAULT 300, -- segundos
                requires_auth BOOLEAN DEFAULT 1,
                platform VARCHAR(20) DEFAULT 'all', -- android, ios, all
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de widgets de usuario
        await this.run(`
            CREATE TABLE IF NOT EXISTS user_widgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                widget_id INTEGER NOT NULL,
                position INTEGER DEFAULT 0,
                is_enabled BOOLEAN DEFAULT 1,
                custom_config TEXT, -- JSON config personalizada
                last_refresh DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (widget_id) REFERENCES widgets(id),
                UNIQUE(user_id, widget_id)
            )
        `);

        // Tabla de favoritos
        await this.run(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                UNIQUE(user_id, product_id)
            )
        `);

        // Tabla de direcciones
        await this.run(`
            CREATE TABLE IF NOT EXISTS addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type VARCHAR(20) DEFAULT 'shipping', -- shipping, billing
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                company VARCHAR(100),
                address_line1 VARCHAR(200) NOT NULL,
                address_line2 VARCHAR(200),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                is_default BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Tabla de configuraciones
        await this.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                type VARCHAR(50) DEFAULT 'string',
                category VARCHAR(50) DEFAULT 'general',
                description TEXT,
                is_public BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de logs
        await this.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                meta TEXT, -- JSON
                ip_address VARCHAR(45),
                user_agent TEXT,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Tabla de notificaciones
        await this.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                data TEXT, -- JSON
                is_read BOOLEAN DEFAULT 0,
                read_at DATETIME,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Tabla de búsquedas
        await this.run(`
            CREATE TABLE IF NOT EXISTS searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                query TEXT NOT NULL,
                results_count INTEGER DEFAULT 0,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('✅ Tablas creadas exitosamente');
    }

    async createIndexes() {
        const indexes = [
            // Usuarios
            'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
            'CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code)',
            
            // Productos
            'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
            'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = 1',
            'CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = 1',
            'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = 1',
            'CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at) WHERE published_at IS NOT NULL',
            
            // Carrito
            'CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id)',
            
            // Órdenes
            'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)',
            'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
            'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)',
            
            // Widgets
            'CREATE INDEX IF NOT EXISTS idx_widgets_type ON widgets(type)',
            'CREATE INDEX IF NOT EXISTS idx_widgets_active ON widgets(is_active) WHERE is_active = 1',
            
            // Favoritos
            'CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id)',
            
            // Búsquedas
            'CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query)',
            'CREATE INDEX IF NOT EXISTS idx_searches_user ON searches(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at)',
            
            // Notificaciones
            'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = 0',
            
            // Logs
            'CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)',
            'CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at)'
        ];

        for (const indexSql of indexes) {
            await this.run(indexSql);
        }

        console.log('✅ Índices creados exitosamente');
    }

    async seedInitialData() {
        try {
            // Verificar si ya hay datos
            const count = await this.get('SELECT COUNT(*) as count FROM categories');
            
            if (count.count === 0) {
                console.log('🌱 Insertando datos iniciales...');
                
                // Insertar categorías principales
                const categories = [
                    ['Hogar y Vida Diaria', 'hogar-vida-diaria', 'Productos para el hogar y vida cotidiana'],
                    ['Tecnología y Electrónica', 'tecnologia-electronica', 'Tecnología de última generación'],
                    ['Moda y Accesorios', 'moda-accesorios', 'Moda exclusiva y accesorios de lujo'],
                    ['Belleza y Cuidado Personal', 'belleza-cuidado-personal', 'Productos premium de belleza'],
                    ['Deportes y Aire Libre', 'deportes-aire-libre', 'Equipamiento deportivo exclusivo'],
                    ['Herramientas y Mejoras del Hogar', 'herramientas-mejoras-hogar', 'Herramientas profesionales'],
                    ['Automotriz', 'automotriz', 'Accesorios y productos automotrices premium'],
                    ['Educación y Oficina', 'educacion-oficina', 'Productos para educación y oficina'],
                    ['Alimentos y Bebidas', 'alimentos-bebidas', 'Gourmet y productos exclusivos'],
                    ['Bebés y Niños', 'bebes-ninos', 'Productos premium para bebés y niños'],
                    ['Juguetes y Entretenimiento', 'juguetes-entretenimiento', 'Juguetes exclusivos y entretenimiento'],
                    ['Salud y Bienestar', 'salud-bienestar', 'Productos para salud y bienestar'],
                    ['Arte, Manualidades y Pasatiempos', 'arte-manualidades-pasatiempos', 'Materiales artísticos premium']
                ];

                for (const [name, slug, description] of categories) {
                    await this.run(
                        'INSERT INTO categories (name, slug, description, display_order) VALUES (?, ?, ?, ?)',
                        [name, slug, description, categories.indexOf([name, slug, description]) + 1]
                    );
                }

                // Insertar widgets por defecto
                const widgets = [
                    ['Últimos Productos', 'new_products', 'Muestra los productos más recientes', 'medium'],
                    ['Ofertas Especiales', 'special_offers', 'Ofertas y promociones exclusivas', 'small'],
                    ['Productos Recomendados', 'recommended', 'Productos recomendados para ti', 'medium'],
                    ['Estado de Pedido', 'order_status', 'Sigue el estado de tu último pedido', 'small'],
                    ['Novedades Russo', 'russo_news', 'Últimas noticias y actualizaciones', 'large'],
                    ['Favoritos', 'favorites', 'Acceso rápido a tus productos favoritos', 'small'],
                    ['Carrito Rápido', 'quick_cart', 'Vista rápida de tu carrito', 'small'],
                    ['Búsqueda Rápida', 'quick_search', 'Busca productos rápidamente', 'small'],
                    ['Notificaciones', 'notifications', 'Tus notificaciones no leídas', 'medium'],
                    ['Eventos Exclusivos', 'exclusive_events', 'Próximos eventos y lanzamientos', 'medium'],
                    ['Wishlist', 'wishlist', 'Tu lista de deseos', 'medium'],
                    ['Historial', 'history', 'Tu historial de navegación', 'large'],
                    ['Métricas Personales', 'personal_metrics', 'Tus estadísticas y métricas', 'medium'],
                    ['Accesos Directos', 'shortcuts', 'Accesos directos a secciones', 'small'],
                    ['Widget Interactivo 3D', 'interactive_3d', 'Producto 3D interactivo del día', 'large']
                ];

                for (const [name, type, description, size] of widgets) {
                    await this.run(
                        `INSERT INTO widgets (name, type, description, size, configuration, data_source, refresh_interval) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            name,
                            type,
                            description,
                            size,
                            JSON.stringify({ theme: 'dark', limit: type === 'large' ? 1 : 5 }),
                            `/api/widgets/data/${type}`,
                            type === 'interactive_3d' ? 86400 : 300
                        ]
                    );
                }

                // Insertar configuraciones por defecto
                const settings = [
                    ['app_name', 'Russo', 'string', 'general', 'Nombre de la aplicación'],
                    ['currency', 'USD', 'string', 'payment', 'Moneda por defecto'],
                    ['tax_rate', '0', 'number', 'payment', 'Tasa de impuestos'],
                    ['shipping_enabled', '1', 'boolean', 'shipping', '¿Envíos habilitados?'],
                    ['sms_verification', '1', 'boolean', 'security', '¿Verificación por SMS?'],
                    ['max_login_attempts', '5', 'number', 'security', 'Intentos máximos de login'],
                    ['session_timeout', '3600', 'number', 'security', 'Timeout de sesión en segundos'],
                    ['default_language', 'es_VE', 'string', 'localization', 'Idioma por defecto'],
                    ['maintenance_mode', '0', 'boolean', 'general', 'Modo mantenimiento'],
                    ['enable_3d_viewer', '1', 'boolean', 'features', '¿Visor 3D habilitado?'],
                    ['enable_widgets', '1', 'boolean', 'features', '¿Widgets habilitados?'],
                    ['enable_notifications', '1', 'boolean', 'features', '¿Notificaciones habilitadas?'],
                    ['cache_duration', '3600', 'number', 'performance', 'Duración de caché en segundos'],
                    ['max_upload_size', '52428800', 'number', 'uploads', 'Tamaño máximo de subida en bytes'],
                    ['product_images_limit', '10', 'number', 'products', 'Límite de imágenes por producto']
                ];

                for (const [key, value, type, category, description] of settings) {
                    await this.run(
                        'INSERT INTO settings (key, value, type, category, description) VALUES (?, ?, ?, ?, ?)',
                        [key, value, type, category, description]
                    );
                }

                // Crear usuario administrador
                const adminPhone = process.env.ADMIN_PHONE || '+584141234567';
                const adminPassword = await require('bcryptjs').hash('AdminRusso2024!', 12);
                
                await this.run(
                    `INSERT INTO users (phone, password, first_name, last_name, country_code, 
                                      verified, is_admin, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                    [adminPhone, adminPassword, 'Admin', 'Russo', 'VE', 1, 1]
                );

                console.log('✅ Datos iniciales insertados exitosamente');
            }
        } catch (error) {
            console.error('❌ Error al insertar datos iniciales:', error);
        }
    }

    // Métodos de ayuda
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Conexión a base de datos cerrada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async backup() {
        const backupPath = this.dbPath.replace('.db', `_backup_${Date.now()}.db`);
        return new Promise((resolve, reject) => {
            this.db.backup(backupPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Backup creado: ${backupPath}`);
                    resolve(backupPath);
                }
            });
        });
    }
}

// Patrón Singleton
let instance = null;

async function connectDatabase() {
    if (!instance) {
        instance = new Database();
        await instance.connect();
    }
    return instance;
}

function getDatabase() {
    if (!instance) {
        throw new Error('Database not connected. Call connectDatabase() first.');
    }
    return instance;
}

module.exports = {
    connectDatabase,
    getDatabase,
    Database
};
