const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logToFile } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// CREAR ORDEN
router.post('/', authenticate, [
  body('shipping_address_id').isInt().withMessage('Dirección de envío inválida'),
  body('billing_address_id').optional().isInt().withMessage('Dirección de facturación inválida'),
  body('shipping_method').notEmpty().withMessage('Método de envío requerido'),
  body('payment_method').notEmpty().withMessage('Método de pago requerido'),
  body('notes').optional().isString()
], validateRequest, async (req, res) => {
  try {
    const {
      shipping_address_id,
      billing_address_id,
      shipping_method,
      payment_method,
      notes
    } = req.body;
    
    const userId = req.userId;
    
    // 1. Obtener resumen del carrito
    const cartItems = await db.all(`
      SELECT 
        c.*,
        p.name, p.sku, p.stock_quantity,
        (p.stock_quantity < c.quantity AND p.stock_quantity IS NOT NULL) as out_of_stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [userId]);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }
    
    // Verificar stock
    const outOfStockItems = cartItems.filter(item => item.out_of_stock);
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Algunos productos no tienen stock suficiente',
        out_of_stock_items: outOfStockItems.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          requested: item.quantity,
          available: item.stock_quantity
        }))
      });
    }
    
    // 2. Obtener direcciones
    const shippingAddress = await db.get(`
      SELECT * FROM addresses 
      WHERE id = ? AND user_id = ?
    `, [shipping_address_id, userId]);
    
    if (!shippingAddress) {
      return res.status(404).json({ error: 'Dirección de envío no encontrada' });
    }
    
    let billingAddress = shippingAddress;
    if (billing_address_id && billing_address_id !== shipping_address_id) {
      billingAddress = await db.get(`
        SELECT * FROM addresses 
        WHERE id = ? AND user_id = ?
      `, [billing_address_id, userId]);
      
      if (!billingAddress) {
        return res.status(404).json({ error: 'Dirección de facturación no encontrada' });
      }
    }
    
    // 3. Calcular totales
    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    
    // Configuración
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
    
    // 4. Generar número de orden único
    const orderNumber = 'RUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 5. Crear orden (transacción)
    const orderResult = await db.run(`
      INSERT INTO orders (
        order_number, user_id, status, 
        total_amount, subtotal, tax_amount, shipping_amount,
        shipping_address, billing_address, shipping_method,
        payment_method, payment_status, notes
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      orderNumber,
      userId,
      parseFloat(totalAmount.toFixed(2)),
      parseFloat(subtotal.toFixed(2)),
      parseFloat(taxAmount.toFixed(2)),
      parseFloat(shippingAmount.toFixed(2)),
      JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress),
      shipping_method,
      payment_method,
      notes || null
    ]);
    
    const orderId = orderResult.lastID;
    
    // 6. Crear items de la orden
    for (const item of cartItems) {
      await db.run(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_sku,
          quantity, unit_price, total_price, options
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.product_id,
        item.name,
        item.sku,
        item.quantity,
        item.price,
        item.price * item.quantity,
        item.options || null
      ]);
      
      // Actualizar stock del producto
      if (item.stock_quantity !== null) {
        await db.run(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ?,
              sales_count = sales_count + ?,
              updated_at = datetime('now')
          WHERE id = ?
        `, [item.quantity, item.quantity, item.product_id]);
      }
    }
    
    // 7. Vaciar carrito
    await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    // 8. Crear notificación
    await db.run(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'order_created', '¡Orden creada!', 'Tu orden #${orderNumber} ha sido creada exitosamente.', ?)
    `, [userId, JSON.stringify({ order_id: orderId, order_number: orderNumber })]);
    
    logToFile('info', `Orden creada: ${orderNumber}`, { 
      userId, 
      orderId, 
      total: totalAmount 
    });
    
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('Error al crear orden:', error);
    logToFile('error', 'Error en POST /orders', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER TODAS LAS ÓRDENES DEL USUARIO
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const orders = await db.all(`
      SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    // Parsear direcciones
    orders.forEach(order => {
      if (order.shipping_address) {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch (e) {
          order.shipping_address = {};
        }
      }
      
      if (order.billing_address) {
        try {
          order.billing_address = JSON.parse(order.billing_address);
        } catch (e) {
          order.billing_address = {};
        }
      }
    });
    
    // Obtener total
    const totalResult = await db.get(`
      SELECT COUNT(*) as total FROM orders WHERE user_id = ?
    `, [userId]);
    
    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
        hasMore: page * limit < totalResult.total
      }
    });
    
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    logToFile('error', 'Error en GET /orders', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER ORDEN POR ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Obtener orden
    const order = await db.get(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Obtener items de la orden
    const orderItems = await db.all(`
      SELECT 
        oi.*,
        p.main_image_url,
        p.is_active
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    // Procesar URLs
    orderItems.forEach(item => {
      if (item.main_image_url) {
        item.main_image_url = `${req.protocol}://${req.get('host')}/uploads/products/main/${item.main_image_url}`;
      }
      
      if (item.options) {
        try {
          item.options = JSON.parse(item.options);
        } catch (e) {
          item.options = {};
        }
      }
    });
    
    // Parsear direcciones
    if (order.shipping_address) {
      try {
        order.shipping_address = JSON.parse(order.shipping_address);
      } catch (e) {
        order.shipping_address = {};
      }
    }
    
    if (order.billing_address) {
      try {
        order.billing_address = JSON.parse(order.billing_address);
      } catch (e) {
        order.billing_address = {};
      }
    }
    
    // Obtener historial de estados
    const statusHistory = [
      {
        status: 'pending',
        date: order.created_at,
        description: 'Orden creada'
      }
    ];
    
    if (order.payment_status === 'paid') {
      statusHistory.push({
        status: 'paid',
        date: order.updated_at,
        description: 'Pago confirmado'
      });
    }
    
    if (order.status === 'processing') {
      statusHistory.push({
        status: 'processing',
        date: order.updated_at,
        description: 'En preparación'
      });
    }
    
    if (order.status === 'shipped') {
      statusHistory.push({
        status: 'shipped',
        date: order.updated_at,
        description: 'Enviado'
      });
    }
    
    if (order.status === 'delivered' && order.delivered_at) {
      statusHistory.push({
        status: 'delivered',
        date: order.delivered_at,
        description: 'Entregado'
      });
    }
    
    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems,
        status_history: statusHistory
      }
    });
    
  } catch (error) {
    console.error('Error al obtener orden:', error);
    logToFile('error', `Error en GET /orders/${req.params.id}`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// CANCELAR ORDEN
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Verificar que la orden existe y pertenece al usuario
    const order = await db.get(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Verificar que se pueda cancelar
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        error: `No se puede cancelar una orden en estado: ${order.status}` 
      });
    }
    
    // Actualizar estado
    await db.run(`
      UPDATE orders 
      SET status = 'cancelled',
          cancelled_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `, [id]);
    
    // Restaurar stock de productos
    const orderItems = await db.all(`
      SELECT product_id, quantity FROM order_items 
      WHERE order_id = ?
    `, [id]);
    
    for (const item of orderItems) {
      await db.run(`
        UPDATE products 
        SET stock_quantity = stock_quantity + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }
    
    // Crear notificación
    await db.run(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'order_cancelled', 'Orden cancelada', 'Tu orden #${order.order_number} ha sido cancelada.', ?)
    `, [userId, JSON.stringify({ order_id: id, order_number: order.order_number })]);
    
    logToFile('info', `Orden cancelada: ${order.order_number}`, { userId, orderId: id });
    
    res.json({
      success: true,
      message: 'Orden cancelada exitosamente'
    });
    
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    logToFile('error', `Error en POST /orders/${req.params.id}/cancel`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RASTREAR ORDEN
router.get('/:id/track', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const order = await db.get(`
      SELECT 
        o.*,
        a.address_line1, a.city, a.state, a.postal_code, a.country
      FROM orders o
      LEFT JOIN addresses a ON JSON_EXTRACT(o.shipping_address, '$.id') = a.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, userId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Estado de envío simulado (en producción integrar con API de mensajería)
    const trackingInfo = {
      order_number: order.order_number,
      status: order.status,
      estimated_delivery: order.estimated_delivery,
      shipping_method: order.shipping_method,
      shipping_address: {
        line1: order.address_line1,
        city: order.city,
        state: order.state,
        postal_code: order.postal_code,
        country: order.country
      },
      tracking_number: 'RUS-' + order.id + '-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      tracking_steps: generateTrackingSteps(order.status),
      last_update: new Date().toISOString()
    };
    
    res.json({
      success: true,
      tracking: trackingInfo
    });
    
  } catch (error) {
    console.error('Error al rastrear orden:', error);
    logToFile('error', `Error en GET /orders/${req.params.id}/track`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER ESTADO DE ORDEN
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const order = await db.get(`
      SELECT status, payment_status, updated_at 
      FROM orders 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json({
      success: true,
      status: {
        order_status: order.status,
        payment_status: order.payment_status,
        last_updated: order.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error al obtener estado de orden:', error);
    logToFile('error', `Error en GET /orders/${req.params.id}/status`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// CONFIRMAR PAGO (simulado - en producción integrar con pasarela real)
router.post('/:id/confirm-payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { transaction_id, payment_method } = req.body;
    
    const order = await db.get(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'La orden ya ha sido pagada' });
    }
    
    // Simular confirmación de pago
    await db.run(`
      UPDATE orders 
      SET payment_status = 'paid',
          transaction_id = ?,
          status = 'processing',
          updated_at = datetime('now')
      WHERE id = ?
    `, [transaction_id || `TXN-${Date.now()}`, id]);
    
    // Crear notificación
    await db.run(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'payment_confirmed', '¡Pago confirmado!', 'El pago de tu orden #${order.order_number} ha sido confirmado.', ?)
    `, [userId, JSON.stringify({ order_id: id, order_number: order.order_number })]);
    
    logToFile('info', `Pago confirmado: orden ${order.order_number}`, { 
      userId, 
      orderId: id,
      transaction_id 
    });
    
    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      order: {
        id,
        order_number: order.order_number,
        payment_status: 'paid',
        status: 'processing'
      }
    });
    
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    logToFile('error', `Error en POST /orders/${req.params.id}/confirm-payment`, error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función auxiliar para generar pasos de rastreo
function generateTrackingSteps(status) {
  const steps = [
    { step: 1, name: 'Orden recibida', description: 'Hemos recibido tu orden', completed: true, date: new Date().toISOString() },
    { step: 2, name: 'Confirmación de pago', description: 'Pago verificado y confirmado', completed: false },
    { step: 3, name: 'En preparación', description: 'Tu pedido está siendo preparado', completed: false },
    { step: 4, name: 'Enviado', description: 'Tu pedido ha sido enviado', completed: false },
    { step: 5, name: 'En tránsito', description: 'Tu pedido está en camino', completed: false },
    { step: 6, name: 'Entregado', description: 'Pedido entregado', completed: false }
  ];
  
  switch (status) {
    case 'pending':
      steps[1].completed = false;
      break;
    case 'processing':
      steps[1].completed = true;
      steps[1].date = new Date(Date.now() - 86400000).toISOString();
      steps[2].completed = true;
      steps[2].date = new Date().toISOString();
      break;
    case 'shipped':
      steps[1].completed = true;
      steps[1].date = new Date(Date.now() - 172800000).toISOString();
      steps[2].completed = true;
      steps[2].date = new Date(Date.now() - 86400000).toISOString();
      steps[3].completed = true;
      steps[3].date = new Date().toISOString();
      break;
    case 'delivered':
      steps.forEach(step => {
        step.completed = true;
        step.date = new Date(Date.now() - (6 - step.step) * 86400000).toISOString();
      });
      break;
  }
  
  return steps;
}

module.exports = router;
