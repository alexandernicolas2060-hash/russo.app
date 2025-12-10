const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// Dashboard stats
router.get('/stats', authenticateToken, (req, res) => {
  // Verificar admin (simplificado)
  
  const stats = {};
  
  // Obtener conteo de usuarios
  db.get('SELECT COUNT(*) as total FROM users', (err, userCount) => {
    if (!err) stats.totalUsers = userCount.total;
    
    // Obtener conteo de productos
    db.get('SELECT COUNT(*) as total FROM products', (err, productCount) => {
      if (!err) stats.totalProducts = productCount.total;
      
      // Obtener conteo de pedidos
      db.get('SELECT COUNT(*) as total FROM orders', (err, orderCount) => {
        if (!err) stats.totalOrders = orderCount.total;
        
        // Obtener ingresos totales
        db.get('SELECT SUM(total) as revenue FROM orders WHERE status = "completed"', 
          (err, revenue) => {
            if (!err) stats.totalRevenue = revenue.revenue || 0;
            
            res.json({ stats });
          }
        );
      });
    });
  });
});

// Product management
router.get('/products', authenticateToken, (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  db.all(
    'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [parseInt(limit), parseInt(offset)],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener productos' });
      }
      
      // Parsear imágenes
      products.forEach(product => {
        if (product.images) {
          try {
            product.images = JSON.parse(product.images);
          } catch (e) {
            product.images = [];
          }
        }
      });
      
      res.json({ products });
    }
  );
});

// User management
router.get('/users', authenticateToken, (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT id, phone, first_name, last_name, email, verified, created_at 
     FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      
      res.json({ users });
    }
  );
});

// Order management
router.get('/orders/all', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT o.*, u.phone, u.first_name, u.last_name 
               FROM orders o 
               JOIN users u ON o.user_id = u.id`;
  
  let params = [];
  
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener pedidos' });
    }
    
    res.json({ orders });
  });
});

module.exports = router;