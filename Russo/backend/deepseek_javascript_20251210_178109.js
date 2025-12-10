const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

// Configurar multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Obtener todos los productos
router.get('/', (req, res) => {
  const { category, gender, minPrice, maxPrice, sort = 'newest', page = 1, limit = 20 } = req.query;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  let params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (gender) {
    query += ' AND gender = ?';
    params.push(gender);
  }
  
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(minPrice);
  }
  
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(maxPrice);
  }
  
  // Ordenar
  switch(sort) {
    case 'price_asc':
      query += ' ORDER BY price ASC';
      break;
    case 'price_desc':
      query += ' ORDER BY price DESC';
      break;
    case 'popular':
      query += ' ORDER BY rating DESC';
      break;
    default:
      query += ' ORDER BY created_at DESC';
  }
  
  // Paginación
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    
    // Contar total
    db.get('SELECT COUNT(*) as total FROM products', (err, count) => {
      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count.total,
          totalPages: Math.ceil(count.total / limit)
        }
      });
    });
  });
});

// Obtener producto por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Convertir imágenes de string a array
    if (product.images) {
      product.images = JSON.parse(product.images);
    }
    
    // Convertir especificaciones
    if (product.specs) {
      product.specs = JSON.parse(product.specs);
    }
    
    res.json({ product });
  });
});

// Producto destacado (último publicado)
router.get('/featured/latest', (req, res) => {
  db.get(
    'SELECT * FROM products ORDER BY created_at DESC LIMIT 1',
    (err, product) => {
      if (err || !product) {
        return res.status(404).json({ error: 'No hay productos disponibles' });
      }
      
      if (product.images) {
        product.images = JSON.parse(product.images);
      }
      
      res.json({ product });
    }
  );
});

// Buscar productos
router.get('/search/:query', (req, res) => {
  const query = `%${req.params.query}%`;
  
  db.all(
    `SELECT * FROM products 
     WHERE name LIKE ? OR description LIKE ? OR category LIKE ? 
     ORDER BY created_at DESC`,
    [query, query, query],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Error en la búsqueda' });
      }
      res.json({ products });
    }
  );
});

// Subir producto (admin)
router.post('/', upload.array('images', 10), (req, res) => {
  const {
    name,
    description,
    price,
    category,
    subcategory,
    gender,
    specs,
    stock
  } = req.body;
  
  // Procesar imágenes
  const images = req.files ? req.files.map(file => ({
    url: `/uploads/products/${file.filename}`,
    alt: name
  })) : [];
  
  // Convertir especificaciones a JSON
  let specsJson = {};
  if (specs) {
    try {
      specsJson = JSON.parse(specs);
    } catch (e) {
      specsJson = {};
    }
  }
  
  db.run(
    `INSERT INTO products (name, description, price, category, subcategory, gender, images, specs, stock) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description,
      parseFloat(price),
      category,
      subcategory,
      gender,
      JSON.stringify(images),
      JSON.stringify(specsJson),
      parseInt(stock)
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear producto' });
      }
      
      res.json({
        success: true,
        message: 'Producto creado exitosamente',
        productId: this.lastID
      });
    }
  );
});

// Modelo 3D
router.post('/:id/3d-model', upload.single('model'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Modelo 3D requerido' });
  }
  
  const modelPath = `/uploads/products/${req.file.filename}`;
  
  db.run(
    'UPDATE products SET model_3d = ? WHERE id = ?',
    [modelPath, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al subir modelo 3D' });
      }
      
      res.json({
        success: true,
        message: 'Modelo 3D subido exitosamente',
        modelPath
      });
    }
  );
});

module.exports = router;