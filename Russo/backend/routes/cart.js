const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logToFile } = require('../utils/logger');

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// OBTENER CARRITO DEL USUARIO
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    const cartItems = await db.all(`
      SELECT 
        c.*,
        p.name, p.main_image_url, p.stock_quantity, p.is_active,
        (p.stock_quantity < c.quantity AND p.stock_quantity IS NOT NULL) as out_of_stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC
    `, [userId]);
    
    // Procesar URLs y calcular totales
    let subtotal = 0;
    let totalItems = 0;
    
    const processedItems = cartItems.map(item => {
      // Procesar imagen
      if (item.main_image_url) {
        item.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${item.main_image_url}`;
      }
      
      // Calcular total por item
      item.item_total = item.price * item.quantity;
      subtotal += item.item_total;
      totalItems += item.quantity;
      
      // Parsear opciones si existen
      if (item.options) {
        try {
          item.options = JSON.parse(item.options);
        } catch (e) {
          item.options = {};
        }
      }
      
      return item;
    });
    
    // Calcular totales
    const taxRate = 0.16; // 16% de IVA (ajustar según país)
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal > 100 ? 0 : 15; // Envío gratis sobre $100
    const totalAmount = subtotal + taxAmount + shippingAmount;
    
    res.json({
      success: true,
      items: processedItems,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        shipping_amount: parseFloat(shippingAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        total_items: totalItems,
        item_count: processedItems.length
      }
    });
    
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    logToFile('error', 'Error en GET /cart', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// AGREGAR ITEM AL CARRITO
router.post('/items', authenticate, [
  body('product_id').isInt().withMessage('ID de producto inválido'),
  body('quantity').isInt({ min: 1 }).withMessage('Cantidad inválida'),
  body('options').optional().isObject().withMessage('Opciones inválidas')
], validateRequest, async (req, res) => {
  try {
    const { product_id, quantity, options } = req.body;
    const userId = req.userId;
    
    // Verificar que el producto existe y está disponible
    const product = await db.get(`
      SELECT id, price, stock_quantity, is_active 
      FROM products 
      WHERE id = ? AND is_active = 1
    `, [product_id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado o no disponible' });
    }
    
    // Verificar stock
    if (product.stock_quantity !== null && product.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Stock insuficiente', 
        available: product.stock_quantity 
      });
    }
    
    // Verificar si el producto ya está en el carrito
    const existingItem = await db.get(`
      SELECT id, quantity FROM cart 
      WHERE user_id = ? AND product_id = ?
    `, [userId, product_id]);
    
    if (existingItem) {
      // Actualizar cantidad
      const newQuantity = existingItem.quantity + quantity;
      
      // Verificar stock nuevamente
      if (product.stock_quantity !== null && product.stock_quantity < newQuantity) {
        return res.status(400).json({ 
          error: 'Stock insuficiente para la cantidad solicitada', 
          available: product.stock_quantity,
          current_in_cart: existingItem.quantity
        });
      }
      
      await db.run(`
        UPDATE cart 
        SET quantity = ?, 
            options = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [
        newQuantity,
        options ? JSON.stringify(options) : null,
        existingItem.id
      ]);
      
      logToFile('info', `Carrito actualizado: producto ${product_id}`, { 
        userId, 
        quantity: newQuantity 
      });
      
    } else {
      // Agregar nuevo item
      await db.run(`
        INSERT INTO cart (user_id, product_id, quantity, price, options)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        product_id,
        quantity,
        product.price,
        options ? JSON.stringify(options) : null
      ]);
      
      logToFile('info', `Producto agregado al carrito: ${product_id}`, { 
        userId, 
        quantity 
      });
    }
    
    // Obtener conteo actualizado del carrito
    const cartCount = await db.get(`
      SELECT SUM(quantity) as total_items 
      FROM cart 
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      cart_count: cartCount.total_items || 0
    });
    
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    logToFile('error', 'Error en POST /cart/items', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ACTUALIZAR CANTIDAD DE ITEM
router.put('/items/:itemId', authenticate, [
  body('quantity').isInt({ min: 1 }).withMessage('Cantidad inválida')
], validateRequest, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;
    
    // Verificar que el item existe y pertenece al usuario
    const item = await db.get(`
      SELECT c.*, p.stock_quantity 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [itemId, userId]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }
    
    // Verificar stock
    if (item.stock_quantity !== null && item.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Stock insuficiente', 
        available: item.stock_quantity 
      });
    }
    
    // Actualizar cantidad
    await db.run(`
      UPDATE cart 
      SET quantity = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [quantity, itemId]);
    
    logToFile('info', `Cantidad actualizada en carrito: item ${itemId}`, { 
      userId, 
      quantity 
    });
    
    res.json({
      success: true,
      message: 'Cantidad actualizada'
    });
    
  } catch (error) {
    console.error('Error al actualizar item del carrito:', error);
    logToFile('error', `Error en PUT /cart/items/${req.params.itemId}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ELIMINAR ITEM DEL CARRITO
router.delete('/items/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    
    // Verificar que el item existe y pertenece al usuario
    const item = await db.get(`
      SELECT id FROM cart 
      WHERE id = ? AND user_id = ?
    `, [itemId, userId]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }
    
    // Eliminar item
    await db.run('DELETE FROM cart WHERE id = ?', [itemId]);
    
    logToFile('info', `Item eliminado del carrito: ${itemId}`, { userId });
    
    // Obtener nuevo conteo
    const cartCount = await db.get(`
      SELECT SUM(quantity) as total_items 
      FROM cart 
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Item eliminado del carrito',
      cart_count: cartCount.total_items || 0
    });
    
  } catch (error) {
    console.error('Error al eliminar item del carrito:', error);
    logToFile('error', `Error en DELETE /cart/items/${req.params.itemId}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// VACIAR CARRITO
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    logToFile('info', `Carrito vaciado`, { userId });
    
    res.json({
      success: true,
      message: 'Carrito vaciado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    logToFile('error', 'Error en DELETE /cart/clear', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER CONTEO DEL CARRITO
router.get('/count', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await db.get(`
      SELECT 
        COUNT(*) as item_count,
        SUM(quantity) as total_items,
        SUM(price * quantity) as subtotal
      FROM cart 
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      success: true,
      count: {
        item_count: result.item_count || 0,
        total_items: result.total_items || 0,
        subtotal: result.subtotal || 0
      }
    });
    
  } catch (error) {
    console.error('Error al obtener conteo del carrito:', error);
    logToFile('error', 'Error en GET /cart/count', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ACTUALIZAR MÚLTIPLES ITEMS
router.put('/bulk-update', authenticate, [
  body('items').isArray().withMessage('Items debe ser un array'),
  body('items.*.item_id').isInt().withMessage('ID de item inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad inválida')
], validateRequest, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.userId;
    
    // Verificar stock para todos los items primero
    for (const item of items) {
      const cartItem = await db.get(`
        SELECT c.*, p.stock_quantity 
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.id = ? AND c.user_id = ?
      `, [item.item_id, userId]);
      
      if (!cartItem) {
        return res.status(404).json({ 
          error: `Item ${item.item_id} no encontrado en el carrito` 
        });
      }
      
      if (cartItem.stock_quantity !== null && cartItem.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Stock insuficiente para item ${item.item_id}`,
          item_id: item.item_id,
          available: cartItem.stock_quantity
        });
      }
    }
    
    // Actualizar todos los items
    for (const item of items) {
      await db.run(`
        UPDATE cart 
        SET quantity = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [item.quantity, item.item_id, userId]);
    }
    
    logToFile('info', `Carrito actualizado en bulk`, { 
      userId, 
      item_count: items.length 
    });
    
    res.json({
      success: true,
      message: 'Carrito actualizado exitosamente',
      updated_count: items.length
    });
    
  } catch (error) {
    console.error('Error en actualización bulk del carrito:', error);
    logToFile('error', 'Error en PUT /cart/bulk-update', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER RESUMEN PARA CHECKOUT
router.get('/checkout-summary', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Obtener items del carrito
    const cartItems = await db.all(`
      SELECT 
        c.*,
        p.name, p.main_image_url, p.stock_quantity,
        (p.stock_quantity < c.quantity AND p.stock_quantity IS NOT NULL) as out_of_stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC
    `, [userId]);
    
    // Verificar si hay items sin stock
    const outOfStockItems = cartItems.filter(item => item.out_of_stock);
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Algunos productos no tienen stock suficiente',
        out_of_stock_items: outOfStockItems.map(item => ({
          item_id: item.id,
          product_id: item.product_id,
          product_name: item.name,
          requested: item.quantity,
          available: item.stock_quantity
        }))
      });
    }
    
    // Calcular totales
    let subtotal = 0;
    let totalItems = 0;
    
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
      totalItems += item.quantity;
    });
    
    // Configuración de envío e impuestos
    const settings = await db.all(`
      SELECT key, value FROM settings 
      WHERE category IN ('payment', 'shipping')
    `);
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    const taxRate = parseFloat(settingsObj.tax_rate || 0.16);
    const freeShippingThreshold = parseFloat(settingsObj.free_shipping_threshold || 100);
    const defaultShippingCost = parseFloat(settingsObj.default_shipping_cost || 15);
    
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= freeShippingThreshold ? 0 : defaultShippingCost;
    const totalAmount = subtotal + taxAmount + shippingAmount;
    
    // Obtener direcciones del usuario
    const addresses = await db.all(`
      SELECT * FROM addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);
    
    // Obtener métodos de pago disponibles
    const paymentMethods = [
      {
        id: 'card',
        name: 'Tarjeta de crédito/débito',
        icon: 'credit-card',
        available: true
      },
      {
        id: 'transfer',
        name: 'Transferencia bancaria',
        icon: 'bank',
        available: true
      },
      {
        id: 'cash',
        name: 'Pago en efectivo',
        icon: 'money',
        available: true
      }
    ];
    
    res.json({
      success: true,
      summary: {
        items: cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_total: item.price * item.quantity,
          image_url: item.main_image_url ? 
            `${req.protocol}://${req.get('host')}/uploads/products/main/${item.main_image_url}` : null
        })),
        totals: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax_amount: parseFloat(taxAmount.toFixed(2)),
          shipping_amount: parseFloat(shippingAmount.toFixed(2)),
          total_amount: parseFloat(totalAmount.toFixed(2)),
          total_items: totalItems,
          item_count: cartItems.length
        },
        addresses,
        payment_methods: paymentMethods
      }
    });
    
  } catch (error) {
    console.error('Error al obtener resumen de checkout:', error);
    logToFile('error', 'Error en GET /cart/checkout-summary', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
