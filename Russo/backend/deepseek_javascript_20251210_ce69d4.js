const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// Obtener carrito del usuario
router.get('/', authenticateToken, (req, res) => {
  db.all(
    `SELECT c.*, p.name, p.price, p.images, p.stock 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [req.user.userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener carrito' });
      }
      
      // Calcular total
      let total = 0;
      const processedItems = items.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Parsear imágenes
        let images = [];
        if (item.images) {
          try {
            images = JSON.parse(item.images);
          } catch (e) {
            images = [];
          }
        }
        
        return {
          ...item,
          images,
          itemTotal
        };
      });
      
      res.json({
        items: processedItems,
        total: total.toFixed(2),
        count: items.length
      });
    }
  );
});

// Agregar al carrito
router.post('/add', authenticateToken, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'ID de producto requerido' });
  }
  
  // Verificar si el producto ya está en el carrito
  db.get(
    'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
    [req.user.userId, productId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar carrito' });
      }
      
      if (existing) {
        // Actualizar cantidad
        const newQuantity = existing.quantity + parseInt(quantity);
        db.run(
          'UPDATE cart SET quantity = ? WHERE id = ?',
          [newQuantity, existing.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error al actualizar carrito' });
            }
            
            res.json({
              success: true,
              message: 'Cantidad actualizada en el carrito'
            });
          }
        );
      } else {
        // Agregar nuevo item
        db.run(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [req.user.userId, productId, parseInt(quantity)],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error al agregar al carrito' });
            }
            
            res.json({
              success: true,
              message: 'Producto agregado al carrito',
              cartItemId: this.lastID
            });
          }
        );
      }
    }
  );
});

// Actualizar cantidad
router.put('/update/:itemId', authenticateToken, (req, res) => {
  const { quantity } = req.body;
  
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Cantidad válida requerida' });
  }
  
  db.run(
    'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
    [parseInt(quantity), req.params.itemId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar carrito' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' });
      }
      
      res.json({
        success: true,
        message: 'Cantidad actualizada'
      });
    }
  );
});

// Eliminar del carrito
router.delete('/remove/:itemId', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM cart WHERE id = ? AND user_id = ?',
    [req.params.itemId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar del carrito' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' });
      }
      
      res.json({
        success: true,
        message: 'Producto eliminado del carrito'
      });
    }
  );
});

// Vaciar carrito
router.delete('/clear', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM cart WHERE user_id = ?',
    [req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al vaciar carrito' });
      }
      
      res.json({
        success: true,
        message: 'Carrito vaciado exitosamente'
      });
    }
  );
});

module.exports = router;