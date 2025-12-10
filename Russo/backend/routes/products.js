const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');
const { logToFile } = require('../utils/logger');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'backend/uploads/';
    
    if (file.fieldname === 'model_3d') {
      uploadPath += 'models3d/';
    } else if (file.fieldname === 'main_image') {
      uploadPath += 'products/main/';
    } else {
      uploadPath += 'products/others/';
    }
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowed3DTypes = /glb|gltf|obj|usdz|fbx/;
    
    const extname = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (file.fieldname === 'model_3d') {
      if (allowed3DTypes.test(extname)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten formatos 3D: .glb, .gltf, .obj, .usdz, .fbx'));
      }
    } else {
      if (allowedImageTypes.test(extname)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes: jpeg, jpg, png, gif, webp'));
      }
    }
  }
});

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// OBTENER ÚLTIMOS PRODUCTOS
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    const products = await db.all(`
      SELECT 
        p.*,
        c.name as category_name,
        sc.name as subcategory_name,
        (SELECT COUNT(*) FROM favorites WHERE product_id = p.id) as favorites_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = 1 
        AND p.published_at IS NOT NULL
        AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
      ORDER BY p.published_at DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Procesar URLs de imágenes
    const processedProducts = products.map(product => {
      if (product.image_urls) {
        try {
          product.image_urls = JSON.parse(product.image_urls);
        } catch (e) {
          product.image_urls = [];
        }
      } else {
        product.image_urls = [];
      }
      
      // Añadir URL completa para imágenes
      if (product.main_image_url) {
        product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
      }
      
      if (product.model_3d_url) {
        product.model_3d_url = `${req.protocol}://${req.get('host')}/uploads/models3d/${path.basename(product.model_3d_url)}`;
      }
      
      if (product.model_3d_thumbnail) {
        product.model_3d_thumbnail = `${req.protocol}://${req.get('host')}/uploads/products/others/${path.basename(product.model_3d_thumbnail)}`;
      }
      
      return product;
    });
    
    // Obtener total para paginación
    const totalResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE is_active = 1 
        AND published_at IS NOT NULL
        AND (stock_quantity > 0 OR stock_quantity IS NULL)
    `);
    
    res.json({
      success: true,
      products: processedProducts,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
        hasMore: page * limit < totalResult.total
      }
    });
    
  } catch (error) {
    console.error('Error al obtener últimos productos:', error);
    logToFile('error', 'Error en GET /products/latest', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTO DESTACADO
router.get('/featured', async (req, res) => {
  try {
    const product = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = 1 
        AND p.is_featured = 1
        AND p.published_at IS NOT NULL
        AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
      ORDER BY p.published_at DESC
      LIMIT 1
    `);
    
    if (!product) {
      // Si no hay destacado, obtener el más reciente
      const latestProduct = await db.get(`
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.is_active = 1 
          AND p.published_at IS NOT NULL
          AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
        ORDER BY p.published_at DESC
        LIMIT 1
      `);
      
      if (!latestProduct) {
        return res.status(404).json({ error: 'No hay productos disponibles' });
      }
      
      product = latestProduct;
    }
    
    // Procesar URLs
    if (product.image_urls) {
      try {
        product.image_urls = JSON.parse(product.image_urls);
      } catch (e) {
        product.image_urls = [];
      }
    } else {
      product.image_urls = [];
    }
    
    if (product.main_image_url) {
      product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
    }
    
    if (product.model_3d_url) {
      product.model_3d_url = `${req.protocol}://${req.get('host')}/uploads/models3d/${path.basename(product.model_3d_url)}`;
    }
    
    if (product.model_3d_thumbnail) {
      product.model_3d_thumbnail = `${req.protocol}://${req.get('host')}/uploads/products/others/${path.basename(product.model_3d_thumbnail)}`;
    }
    
    res.json({
      success: true,
      product
    });
    
  } catch (error) {
    console.error('Error al obtener producto destacado:', error);
    logToFile('error', 'Error en GET /products/featured', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTO POR ID
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        sc.name as subcategory_name,
        sc.slug as subcategory_slug,
        (SELECT COUNT(*) FROM favorites WHERE product_id = p.id) as favorites_count,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND status = 'approved') as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND status = 'approved') as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ? AND p.is_active = 1
    `, [productId]);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Incrementar contador de vistas
    await db.run(`
      UPDATE products 
      SET views_count = views_count + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `, [productId]);
    
    // Procesar URLs
    if (product.image_urls) {
      try {
        product.image_urls = JSON.parse(product.image_urls).map(img => 
          `${req.protocol}://${req.get('host')}/uploads/products/others/${path.basename(img)}`
        );
      } catch (e) {
        product.image_urls = [];
      }
    } else {
      product.image_urls = [];
    }
    
    if (product.main_image_url) {
      product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
    }
    
    if (product.model_3d_url) {
      product.model_3d_url = `${req.protocol}://${req.get('host')}/uploads/models3d/${path.basename(product.model_3d_url)}`;
    }
    
    if (product.model_3d_thumbnail) {
      product.model_3d_thumbnail = `${req.protocol}://${req.get('host')}/uploads/products/others/${path.basename(product.model_3d_thumbnail)}`;
    }
    
    // Parsear especificaciones y tags
    if (product.specifications) {
      try {
        product.specifications = JSON.parse(product.specifications);
      } catch (e) {
        product.specifications = {};
      }
    }
    
    if (product.tags) {
      try {
        product.tags = JSON.parse(product.tags);
      } catch (e) {
        product.tags = [];
      }
    }
    
    // Obtener productos relacionados (misma categoría)
    const relatedProducts = await db.all(`
      SELECT 
        id, name, price, compare_price, main_image_url, 
        rating, rating_count, is_new, is_featured
      FROM products 
      WHERE category_id = ? 
        AND id != ? 
        AND is_active = 1
        AND published_at IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 4
    `, [product.category_id, productId]);
    
    // Procesar URLs de productos relacionados
    relatedProducts.forEach(relatedProduct => {
      if (relatedProduct.main_image_url) {
        relatedProduct.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(relatedProduct.main_image_url)}`;
      }
    });
    
    res.json({
      success: true,
      product,
      related: relatedProducts
    });
    
  } catch (error) {
    console.error('Error al obtener producto:', error);
    logToFile('error', `Error en GET /products/${req.params.id}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTOS POR CATEGORÍA
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'newest'; // newest, price_asc, price_desc, popular
    
    let sortQuery = 'ORDER BY p.published_at DESC, p.created_at DESC';
    
    switch (sort) {
      case 'price_asc':
        sortQuery = 'ORDER BY p.price ASC';
        break;
      case 'price_desc':
        sortQuery = 'ORDER BY p.price DESC';
        break;
      case 'popular':
        sortQuery = 'ORDER BY p.views_count DESC, p.sales_count DESC';
        break;
      case 'featured':
        sortQuery = 'ORDER BY p.is_featured DESC, p.published_at DESC';
        break;
    }
    
    const products = await db.all(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? 
        AND p.is_active = 1
        AND p.published_at IS NOT NULL
        AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
      ${sortQuery}
      LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]);
    
    // Procesar URLs
    const processedProducts = products.map(product => {
      if (product.main_image_url) {
        product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
      }
      return product;
    });
    
    // Obtener total
    const totalResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE category_id = ? 
        AND is_active = 1
        AND published_at IS NOT NULL
    `, [categoryId]);
    
    res.json({
      success: true,
      products: processedProducts,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
        hasMore: page * limit < totalResult.total
      }
    });
    
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    logToFile('error', 'Error en GET /products/category/:id', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// BUSCAR PRODUCTOS
router.post('/search', [
  body('query').notEmpty().withMessage('Consulta de búsqueda requerida')
], validateRequest, async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Registrar búsqueda
    if (req.userId) {
      await db.run(`
        INSERT INTO searches (user_id, query, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `, [req.userId, query, req.ip, req.get('user-agent')]);
    }
    
    // Construir consulta SQL
    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        MATCH(p.name, p.description, p.tags) AGAINST(?) as relevance
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (p.is_active = 1 AND p.published_at IS NOT NULL)
        AND (MATCH(p.name, p.description, p.tags) AGAINST(? IN BOOLEAN MODE)
             OR p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
    `;
    
    const params = [
      query, query, 
      `%${query}%`, `%${query}%`, `%${query}%`
    ];
    
    // Aplicar filtros
    if (filters.category_id) {
      sql += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.min_price) {
      sql += ' AND p.price >= ?';
      params.push(filters.min_price);
    }
    
    if (filters.max_price) {
      sql += ' AND p.price <= ?';
      params.push(filters.max_price);
    }
    
    if (filters.in_stock === true) {
      sql += ' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)';
    }
    
    if (filters.is_featured === true) {
      sql += ' AND p.is_featured = 1';
    }
    
    if (filters.is_new === true) {
      sql += ' AND p.is_new = 1';
    }
    
    // Ordenar por relevancia
    sql += ' ORDER BY relevance DESC, p.views_count DESC';
    sql += ' LIMIT ? OFFSET ?';
    
    params.push(limit, offset);
    
    const products = await db.all(sql, params);
    
    // Procesar URLs
    const processedProducts = products.map(product => {
      if (product.main_image_url) {
        product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
      }
      return product;
    });
    
    // Obtener total (sin paginación para contar)
    let countSql = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE (p.is_active = 1 AND p.published_at IS NOT NULL)
        AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
    `;
    
    const countParams = [
      `%${query}%`, `%${query}%`, `%${query}%`
    ];
    
    // Aplicar mismos filtros al count
    if (filters.category_id) {
      countSql += ' AND p.category_id = ?';
      countParams.push(filters.category_id);
    }
    
    if (filters.min_price) {
      countSql += ' AND p.price >= ?';
      countParams.push(filters.min_price);
    }
    
    if (filters.max_price) {
      countSql += ' AND p.price <= ?';
      countParams.push(filters.max_price);
    }
    
    const totalResult = await db.get(countSql, countParams);
    
    res.json({
      success: true,
      products: processedProducts,
      query,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
        hasMore: page * limit < totalResult.total
      }
    });
    
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    logToFile('error', 'Error en POST /products/search', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// CREAR PRODUCTO (ADMIN)
router.post('/', authenticate, isAdmin, [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('price').isFloat({ min: 0.01 }).withMessage('Precio inválido'),
  body('category_id').isInt().withMessage('Categoría inválida'),
  body('stock_quantity').optional().isInt().withMessage('Cantidad inválida')
], validateRequest, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'model_3d', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name, description, short_description, price, compare_price, cost,
      category_id, subcategory_id, brand, model, color, size, weight,
      dimensions, material, origin_country, stock_quantity, low_stock_threshold,
      is_featured, is_new, is_3d_available, specifications, tags
    } = req.body;
    
    // Generar SKU único
    const sku = 'RUS' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Procesar archivos subidos
    let mainImageUrl = null;
    let model3dUrl = null;
    let model3dThumbnail = null;
    const imageUrls = [];
    
    if (req.files) {
      if (req.files['main_image']) {
        mainImageUrl = req.files['main_image'][0].filename;
      }
      
      if (req.files['images']) {
        req.files['images'].forEach(file => {
          imageUrls.push(file.filename);
        });
      }
      
      if (req.files['model_3d']) {
        model3dUrl = req.files['model_3d'][0].filename;
        // En una implementación real, generar thumbnail del modelo 3D
        model3dThumbnail = 'thumb_' + Date.now() + '.jpg';
      }
    }
    
    // Insertar producto
    const result = await db.run(`
      INSERT INTO products (
        sku, name, description, short_description, price, compare_price, cost,
        category_id, subcategory_id, brand, model, color, size, weight,
        dimensions, material, origin_country, stock_quantity, low_stock_threshold,
        is_featured, is_new, is_3d_available, main_image_url, image_urls,
        model_3d_url, model_3d_thumbnail, tags, specifications, created_by,
        published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      sku, name, description, short_description, price, compare_price, cost,
      category_id, subcategory_id, brand, model, color, size, weight,
      dimensions, material, origin_country, stock_quantity || 0, low_stock_threshold || 5,
      is_featured ? 1 : 0, is_new ? 1 : 0, is_3d_available ? 1 : 0, mainImageUrl,
      JSON.stringify(imageUrls), model3dUrl, model3dThumbnail,
      JSON.stringify(tags ? tags.split(',') : []),
      JSON.stringify(specifications ? JSON.parse(specifications) : {}),
      req.userId
    ]);
    
    logToFile('info', `Producto creado: ${name}`, { 
      productId: result.lastID, 
      userId: req.userId 
    });
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      productId: result.lastID,
      sku
    });
    
  } catch (error) {
    console.error('Error al crear producto:', error);
    logToFile('error', 'Error en POST /products', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ACTUALIZAR PRODUCTO (ADMIN)
router.put('/:id', authenticate, isAdmin, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'model_3d', maxCount: 1 }
]), async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Verificar que el producto existe
    const existingProduct = await db.get(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Preparar campos para actualización
    const updates = [];
    const params = [];
    
    // Campos básicos
    const fields = [
      'name', 'description', 'short_description', 'price', 'compare_price', 'cost',
      'category_id', 'subcategory_id', 'brand', 'model', 'color', 'size', 'weight',
      'dimensions', 'material', 'origin_country', 'stock_quantity', 'low_stock_threshold',
      'is_featured', 'is_new', 'is_3d_available', 'is_active', 'specifications', 'tags'
    ];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        
        if (field === 'specifications' || field === 'tags') {
          params.push(JSON.stringify(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    });
    
    // Procesar archivos
    if (req.files) {
      if (req.files['main_image']) {
        updates.push('main_image_url = ?');
        params.push(req.files['main_image'][0].filename);
        
        // Eliminar imagen anterior si existe
        if (existingProduct.main_image_url) {
          const oldPath = path.join('backend/uploads/products/main/', existingProduct.main_image_url);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }
      
      if (req.files['images']) {
        const newImages = req.files['images'].map(file => file.filename);
        let existingImages = [];
        
        if (existingProduct.image_urls) {
          try {
            existingImages = JSON.parse(existingProduct.image_urls);
          } catch (e) {
            existingImages = [];
          }
        }
        
        const allImages = [...existingImages, ...newImages];
        updates.push('image_urls = ?');
        params.push(JSON.stringify(allImages));
      }
      
      if (req.files['model_3d']) {
        updates.push('model_3d_url = ?');
        params.push(req.files['model_3d'][0].filename);
        
        // Eliminar modelo anterior si existe
        if (existingProduct.model_3d_url) {
          const oldPath = path.join('backend/uploads/models3d/', existingProduct.model_3d_url);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }
    }
    
    // Añadir timestamp de actualización
    updates.push('updated_at = datetime("now")');
    params.push(productId);
    
    // Ejecutar actualización
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, params);
    
    logToFile('info', `Producto actualizado: ${productId}`, { userId: req.userId });
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    logToFile('error', `Error en PUT /products/${req.params.id}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ELIMINAR PRODUCTO (ADMIN)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Verificar que el producto existe
    const product = await db.get(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Eliminar archivos asociados
    if (product.main_image_url) {
      const imagePath = path.join('backend/uploads/products/main/', product.main_image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (product.model_3d_url) {
      const modelPath = path.join('backend/uploads/models3d/', product.model_3d_url);
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
      }
    }
    
    if (product.image_urls) {
      try {
        const images = JSON.parse(product.image_urls);
        images.forEach(image => {
          const imagePath = path.join('backend/uploads/products/others/', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      } catch (e) {
        // Ignorar errores de parseo
      }
    }
    
    // Eliminar producto (soft delete)
    await db.run(
      'UPDATE products SET is_active = 0, updated_at = datetime("now") WHERE id = ?',
      [productId]
    );
    
    // Eliminar de favoritos
    await db.run('DELETE FROM favorites WHERE product_id = ?', [productId]);
    
    // Eliminar del carrito de todos los usuarios
    await db.run('DELETE FROM cart WHERE product_id = ?', [productId]);
    
    logToFile('info', `Producto eliminado: ${productId}`, { userId: req.userId });
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    logToFile('error', `Error en DELETE /products/${req.params.id}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTOS RELACIONADOS
router.get('/:id/related', async (req, res) => {
  try {
    const productId = req.params.id;
    const limit = parseInt(req.query.limit) || 4;
    
    // Obtener categoría del producto
    const product = await db.get(
      'SELECT category_id FROM products WHERE id = ?',
      [productId]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const relatedProducts = await db.all(`
      SELECT 
        id, name, price, compare_price, main_image_url, 
        rating, rating_count, short_description,
        is_new, is_featured, stock_quantity
      FROM products 
      WHERE category_id = ? 
        AND id != ? 
        AND is_active = 1
        AND published_at IS NOT NULL
        AND (stock_quantity > 0 OR stock_quantity IS NULL)
      ORDER BY RANDOM()
      LIMIT ?
    `, [product.category_id, productId, limit]);
    
    // Procesar URLs
    relatedProducts.forEach(p => {
      if (p.main_image_url) {
        p.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(p.main_image_url)}`;
      }
    });
    
    res.json({
      success: true,
      products: relatedProducts
    });
    
  } catch (error) {
    console.error('Error al obtener productos relacionados:', error);
    logToFile('error', `Error en GET /products/${req.params.id}/related`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTOS EN OFERTA
router.get('/on-sale', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const products = await db.all(`
      SELECT 
        id, name, price, compare_price, main_image_url, 
        rating, rating_count, short_description,
        is_new, is_featured, stock_quantity,
        ROUND(((compare_price - price) / compare_price) * 100, 0) as discount_percent
      FROM products 
      WHERE compare_price IS NOT NULL 
        AND compare_price > price
        AND is_active = 1
        AND published_at IS NOT NULL
        AND (stock_quantity > 0 OR stock_quantity IS NULL)
      ORDER BY discount_percent DESC
      LIMIT ?
    `, [limit]);
    
    // Procesar URLs
    products.forEach(product => {
      if (product.main_image_url) {
        product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
      }
    });
    
    res.json({
      success: true,
      products
    });
    
  } catch (error) {
    console.error('Error al obtener productos en oferta:', error);
    logToFile('error', 'Error en GET /products/on-sale', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER PRODUCTOS POPULARES
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    
    const products = await db.all(`
      SELECT 
        p.id, p.name, p.price, p.compare_price, p.main_image_url, 
        p.rating, p.rating_count, p.short_description,
        p.is_new, p.is_featured, p.stock_quantity,
        COUNT(o.id) as recent_orders
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.created_at >= datetime('now', '-${days} days')
      WHERE p.is_active = 1
        AND p.published_at IS NOT NULL
        AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)
      GROUP BY p.id
      ORDER BY recent_orders DESC, p.views_count DESC
      LIMIT ?
    `, [limit]);
    
    // Procesar URLs
    products.forEach(product => {
      if (product.main_image_url) {
        product.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${path.basename(product.main_image_url)}`;
      }
    });
    
    res.json({
      success: true,
      products
    });
    
  } catch (error) {
    console.error('Error al obtener productos populares:', error);
    logToFile('error', 'Error en GET /products/trending', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
