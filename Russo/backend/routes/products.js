const express = require('express');
const router = express.Router();

// Productos de ejemplo
const products = [
  {
    id: 'P001',
    name: 'iPhone 15 Pro Max',
    description: 'El smartphone más avanzado de Apple con Dynamic Island, cámara de 48MP y chip A17 Pro.',
    price: 1799.99,
    original_price: 1999.99,
    category: 'Tecnología',
    brand: 'Apple',
    stock: 10,
    is_featured: true,
    is_exclusive: false,
    rating: 4.9,
    images: [],
    specifications: {
      pantalla: '6.7" Super Retina XDR',
      procesador: 'A17 Pro',
      memoria: '1TB',
      camara: '48MP + 12MP + 12MP'
    }
  },
  {
    id: 'P002',
    name: 'Sofá Chesterfield Italiano',
    description: 'Sofá de cuero genuino hecho a mano en Italia. Estilo clásico con detalles modernos.',
    price: 4499.99,
    original_price: 4999.99,
    category: 'Muebles',
    brand: 'Chesterfield',
    stock: 3,
    is_featured: true,
    is_exclusive: true,
    rating: 4.8,
    images: [],
    specifications: {
      material: 'Cuero genuino',
      origen: 'Hecho en Italia',
      dimensiones: '220x95x85 cm',
      garantia: '5 años'
    }
  },
  {
    id: 'P003',
    name: 'Reloj Cartier Santos',
    description: 'Reloj de lujo automático con caja de acero y esfera azul. Edición limitada.',
    price: 12499.99,
    original_price: 13999.99,
    category: 'Joyas',
    brand: 'Cartier',
    stock: 1,
    is_featured: true,
    is_exclusive: true,
    rating: 5.0,
    images: [],
    specifications: {
      movimiento: 'Automático',
      material: 'Acero y zafiro',
      resistencia: '100m',
      origen: 'Suiza'
    }
  },
  {
    id: 'P004',
    name: 'Vestido Dior Primavera',
    description: 'Vestido de alta costura de la colección primavera/verano. Hecho en Francia.',
    price: 8899.99,
    original_price: 9499.99,
    category: 'Moda',
    brand: 'Dior',
    stock: 5,
    is_featured: false,
    is_exclusive: false,
    rating: 4.7,
    images: [],
    specifications: {
      material: 'Seda y encaje',
      origen: 'Hecho en Francia',
      cuidados: 'Limpieza en seco',
      temporada: 'Primavera/Verano'
    }
  }
];

// Obtener todos los productos
router.get('/', (req, res) => {
  try {
    const { category, featured, limit = 20, offset = 0 } = req.query;
    
    let filteredProducts = [...products];
    
    // Filtrar por categoría
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filtrar por destacados
    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(p => p.is_featured);
    }
    
    // Paginación
    const paginatedProducts = filteredProducts.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      products: paginatedProducts,
      total: filteredProducts.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener producto por ID
router.get('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Productos relacionados (misma categoría)
    const relatedProducts = products
      .filter(p => p.category === product.category && p.id !== productId)
      .slice(0, 3);
    
    res.json({
      success: true,
      product: {
        ...product,
        related_products: relatedProducts
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Buscar productos
router.get('/search/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    
    const results = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
    
    res.json({
      success: true,
      query,
      results,
      total: results.length
    });
    
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener categorías
router.get('/categories/all', (req, res) => {
  try {
    const categories = [
      { id: 'tech', name: 'Tecnología', count: 1, icon: '💻' },
      { id: 'furniture', name: 'Muebles', count: 1, icon: '🛋️' },
      { id: 'jewelry', name: 'Joyas', count: 1, icon: '💎' },
      { id: 'fashion', name: 'Moda', count: 1, icon: '👗' },
      { id: 'art', name: 'Arte', count: 0, icon: '🎨' },
      { id: 'cars', name: 'Automóviles', count: 0, icon: '🚗' }
    ];
    
    res.json({
      success: true,
      categories
    });
    
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
