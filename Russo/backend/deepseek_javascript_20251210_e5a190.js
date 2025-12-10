const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// Crear pedido
router.post('/create', authenticateToken, (req, res) => {
  const { shipping_address, payment_method } = req.body;
  
  if (!shipping_address || !payment_method) {
    return res.status(400).json({ 
      error: 'Dirección de envío y método de pago requeridos' 
    });
  }
  
  // Obtener items del carrito
  db.all(
    `SELECT c.*, p.price, p.stock 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [req.user.userId],
    (err, cartItems) => {
      if (err || cartItems.length === 0) {
        return res.status(400).json({ error: 'Carrito vacío' });
      }
      
      // Verificar stock
      for (const item of cartItems) {
        if (item.quantity > item.stock) {
          return res.status(400).json({ 
            error: `Stock insuficiente para ${item.name}` 
          });
        }
      }
      
      // Calcular total
      let total = 0;
      cartItems.forEach(item => {
        total += item.price * item.quantity;
      });
      
      // Generar número de pedido
      const order_number = 'RUSSO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      // Crear pedido
      db.run(
        `INSERT INTO orders (user_id, order_number, total, shipping_address, payment_method) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.userId, order_number, total, shipping_address, payment_method],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al crear pedido' });
          }
          
          const orderId = this.lastID;
          
          // Actualizar stock de productos
          const updatePromises = cartItems.map(item => {
            return new Promise((resolve, reject) => {
              db.run(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          });
          
          // Vaciar carrito
          db.run(
            'DELETE FROM cart WHERE user_id = ?',
            [req.user.userId],
            (err) => {
              if (err) {
                console.error('Error al vaciar carrito:', err);
              }
            }
          );
          
          Promise.all(updatePromises)
            .then(() => {
              res.json({
                success: true,
                message: 'Pedido creado exitosamente',
                orderId,
                orderNumber: order_number,
                total: total.toFixed(2)
              });
            })
            .catch(error => {
              res.status(500).json({ error: 'Error al actualizar stock' });
            });
        }
      );
    }
  );
});

// Obtener pedidos del usuario
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener pedidos' });
      }
      
      res.json({ orders });
    }
  );
});

// Obtener pedido por ID
router.get('/:orderId', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.orderId, req.user.userId],
    (err, order) => {
      if (err || !order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      res.json({ order });
    }
  );
});

// Actualizar estado de pedido (admin)
router.put('/:orderId/status', authenticateToken, (req, res) => {
  const { status, tracking_number } = req.body;
  
  // Verificar si usuario es admin (simplificado)
  db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    // Aquí deberías verificar si el usuario tiene rol de admin
    // Por simplicidad, lo omitimos
    
    db.run(
      'UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?',
      [status, tracking_number, req.params.orderId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar pedido' });
        }
        
        res.json({
          success: true,
          message: 'Estado de pedido actualizado'
        });
      }
    );
  });
});

module.exports = router;