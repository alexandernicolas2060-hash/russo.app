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
      ORDER BY c.add
