const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Base de datos temporal en memoria
const usersDB = new Map();
const otpDB = new Map();

// Registrar usuario
router.post('/register', (req, res) => {
  try {
    const { phone, name, password } = req.body;
    
    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono, nombre y contraseña son requeridos'
      });
    }
    
    if (usersDB.has(phone)) {
      return res.status(400).json({
        success: false,
        error: 'El teléfono ya está registrado'
      });
    }
    
    const userId = 'user_' + crypto.randomBytes(8).toString('hex');
    const user = {
      id: userId,
      phone,
      name,
      password, // En producción usar bcrypt
      is_verified: false,
      created_at: new Date().toISOString()
    };
    
    usersDB.set(phone, user);
    
    // Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpDB.set(phone, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutos
      attempts: 0
    });
    
    console.log(`OTP para ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'Registro exitoso. Verifica tu teléfono.',
      user_id: userId,
      requires_verification: true
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar OTP
router.post('/verify', (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono y código son requeridos'
      });
    }
    
    const otpData = otpDB.get(phone);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: 'Código no encontrado o expirado'
      });
    }
    
    if (Date.now() > otpData.expires) {
      otpDB.delete(phone);
      return res.status(400).json({
        success: false,
        error: 'Código expirado'
      });
    }
    
    if (otpData.otp !== code) {
      otpData.attempts++;
      
      if (otpData.attempts >= 3) {
        otpDB.delete(phone);
        return res.status(400).json({
          success: false,
          error: 'Demasiados intentos fallidos'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Código incorrecto',
        attempts_remaining: 3 - otpData.attempts
      });
    }
    
    // Código correcto
    const user = usersDB.get(phone);
    if (user) {
      user.is_verified = true;
    }
    
    otpDB.delete(phone);
    
    const token = 'jwt_' + crypto.randomBytes(16).toString('hex');
    
    res.json({
      success: true,
      message: 'Verificación exitosa',
      token,
      user: {
        id: user?.id,
        phone: user?.phone,
        name: user?.name,
        is_verified: true
      }
    });
    
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono y contraseña son requeridos'
      });
    }
    
    const user = usersDB.get(phone);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }
    
    const token = 'jwt_' + crypto.randomBytes(16).toString('hex');
    
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        is_verified: user.is_verified
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Reenviar OTP
router.post('/resend-otp', (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono es requerido'
      });
    }
    
    const user = usersDB.get(phone);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Generar nuevo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpDB.set(phone, {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    
    console.log(`OTP reenviado para ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'Código reenviado exitosamente'
    });
    
  } catch (error) {
    console.error('Error reenviando OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
