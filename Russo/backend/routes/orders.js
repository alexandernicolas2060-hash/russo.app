const express = require('express');
const router = express.Router();

// Órdenes en memoria (en producción usar base de datos)
const orders = new Map();
let orderCounter = 1;

// Crear orden
router.post('/create', (req, res) => {
  try {
    const { items, shipping_address, payment_method } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items son requeridos'
      });
    }
    
    // Calcular total
    const total = items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
    
    // Generar número de orden
    const orderNumber = `RUSSO-${Date.now().toString().slice(-6)}-${orderCounter.toString().padStart(4, '0')}`;
    orderCounter++;
    
    const order = {
      id: `order_${Date.now()}`,
      order_number: orderNumber,
      items,
      shipping_address: shipping_address || {},
      payment_method: payment_method || 'transfer',
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    orders.set(order.id, order);
    
    res.json({
      success: true,
      message: 'Orden creada exitosamente',
      order
    });
    
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener órdenes del usuario
router.get('/', (req, res) => {
  try {
    // En una app real, filtrar por usuario
    const userOrders = Array.from(orders.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      orders: userOrders,
      total: userOrders.length
    });
    
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener orden específica
router.get('/:order_id', (req, res) => {
  try {
    const { order_id } = req.params;
    const order = orders.get(order_id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar estado de orden
router.put('/:order_id/status', (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }
    
    const order = orders.get(order_id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }
    
    order.status = status;
    order.updated_at = new Date().toISOString();
    orders.set(order_id, order);
    
    res.json({
      success: true,
      message: `Estado actualizado a: ${status}`,
      order
    });
    
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Cancelar orden
router.post('/:order_id/cancel', (req, res) => {
  try {
    const { order_id } = req.params;
    
    const order = orders.get(order_id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }
    
    if (order.status === 'delivered' || order.status === 'shipped') {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una orden ya enviada'
      });
    }
    
    order.status = 'cancelled';
    order.updated_at = new Date().toISOString();
    orders.set(order_id, order);
    
    res.json({
      success: true,
      message: 'Orden cancelada exitosamente',
      order
    });
    
  } catch (error) {
    console.error('Error cancelando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
