const express = require('express');
const router = express.Router();

// Carrito en memoria (en producción usar base de datos)
const carts = new Map();

// Obtener carrito
router.get('/', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default_session';
    let cart = carts.get(sessionId);
    
    if (!cart) {
      cart = {
        id: sessionId,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      carts.set(sessionId, cart);
    }
    
    res.json({
      success: true,
      cart
    });
    
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Agregar al carrito
router.post('/add', (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const sessionId = req.headers['x-session-id'] || 'default_session';
    
    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto es requerido'
      });
    }
    
    let cart = carts.get(sessionId);
    
    if (!cart) {
      cart = {
        id: sessionId,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Buscar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => item.product_id === product_id);
    
    if (existingItemIndex > -1) {
      // Actualizar cantidad
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Agregar nuevo item
      cart.items.push({
        product_id,
        quantity: parseInt(quantity),
        added_at: new Date().toISOString()
      });
    }
    
    cart.updated_at = new Date().toISOString();
    carts.set(sessionId, cart);
    
    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      cart
    });
    
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar cantidad
router.put('/update/:product_id', (req, res) => {
  try {
    const { product_id } = req.params;
    const { quantity } = req.body;
    const sessionId = req.headers['x-session-id'] || 'default_session';
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Cantidad válida es requerida'
      });
    }
    
    const cart = carts.get(sessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Carrito no encontrado'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item.product_id === product_id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado en el carrito'
      });
    }
    
    if (parseInt(quantity) === 0) {
      // Eliminar del carrito si cantidad es 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Actualizar cantidad
      cart.items[itemIndex].quantity = parseInt(quantity);
    }
    
    cart.updated_at = new Date().toISOString();
    carts.set(sessionId, cart);
    
    res.json({
      success: true,
      message: 'Carrito actualizado',
      cart
    });
    
  } catch (error) {
    console.error('Error actualizando carrito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar del carrito
router.delete('/remove/:product_id', (req, res) => {
  try {
    const { product_id } = req.params;
    const sessionId = req.headers['x-session-id'] || 'default_session';
    
    const cart = carts.get(sessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Carrito no encontrado'
      });
    }
    
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product_id !== product_id);
    
    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado en el carrito'
      });
    }
    
    cart.updated_at = new Date().toISOString();
    carts.set(sessionId, cart);
    
    res.json({
      success: true,
      message: 'Producto eliminado del carrito',
      cart
    });
    
  } catch (error) {
    console.error('Error eliminando del carrito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Vaciar carrito
router.delete('/clear', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default_session';
    
    const cart = carts.get(sessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Carrito no encontrado'
      });
    }
    
    cart.items = [];
    cart.updated_at = new Date().toISOString();
    carts.set(sessionId, cart);
    
    res.json({
      success: true,
      message: 'Carrito vaciado',
      cart
    });
    
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
