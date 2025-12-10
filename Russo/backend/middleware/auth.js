const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { logToFile } = require('../utils/logger');

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    // Verificar que el usuario existe y está activo
    const user = await db.get(`
      SELECT id, phone, verified, is_active 
      FROM users 
      WHERE id = ?
    `, [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }
    
    if (!user.verified) {
      return res.status(403).json({ 
        error: 'Usuario no verificado',
        requiresVerification: true 
      });
    }
    
    // Añadir información del usuario a la request
    req.userId = user.id;
    req.userPhone = user.phone;
    
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    logToFile('error', 'Error en middleware authenticate', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar administrador
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const user = await db.get(`
      SELECT is_admin FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    next();
    
  } catch (error) {
    console.error('Error en middleware isAdmin:', error);
    logToFile('error', 'Error en middleware isAdmin', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar suscripción premium
const isPremium = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const user = await db.get(`
      SELECT is_premium, premium_expires_at 
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (!user || !user.is_premium) {
      return res.status(403).json({ 
        error: 'Esta funcionalidad requiere suscripción premium',
        requiresPremium: true 
      });
    }
    
    // Verificar si la suscripción está activa
    if (user.premium_expires_at && new Date(user.premium_expires_at) < new Date()) {
      return res.status(403).json({ 
        error: 'Tu suscripción premium ha expirado',
        premiumExpired: true 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error en middleware isPremium:', error);
    logToFile('error', 'Error en middleware isPremium', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificación de teléfono
const requirePhoneVerification = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const user = await db.get(`
      SELECT verified FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (!user || !user.verified) {
      return res.status(403).json({ 
        error: 'Verificación de teléfono requerida',
        requiresVerification: true 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error en middleware requirePhoneVerification:', error);
    logToFile('error', 'Error en middleware requirePhoneVerification', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para limitar tasa de peticiones por usuario
const rateLimitByUser = (requestsPerMinute = 60) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.userId || req.ip; // Usar IP si no hay usuario autenticado
    const now = Date.now();
    const windowStart = now - 60000; // Último minuto
    
    // Obtener solicitudes del usuario
    let userRequests = requests.get(userId) || [];
    
    // Filtrar solicitudes fuera de la ventana de tiempo
    userRequests = userRequests.filter(time => time > windowStart);
    
    // Verificar límite
    if (userRequests.length >= requestsPerMinute) {
      logToFile('warn', `Rate limit excedido para usuario ${userId}`);
      return res.status(429).json({ 
        error: 'Demasiadas solicitudes. Por favor, espera un momento.' 
      });
    }
    
    // Registrar nueva solicitud
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    // Limpiar entradas antiguas periódicamente
    if (Math.random() < 0.01) { // 1% de probabilidad de limpiar
      for (const [key, times] of requests.entries()) {
        const filtered = times.filter(time => time > windowStart);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
    }
    
    next();
  };
};

// Middleware para validar permisos de recurso
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const resourceId = req.params.id;
      
      let tableName;
      let idColumn = 'id';
      let userColumn = 'user_id';
      
      switch (resourceType) {
        case 'order':
          tableName = 'orders';
          break;
        case 'address':
          tableName = 'addresses';
          break;
        case 'review':
          tableName = 'reviews';
          break;
        case 'favorite':
          tableName = 'favorites';
          break;
        default:
          return res.status(400).json({ error: 'Tipo de recurso no válido' });
      }
      
      // Verificar que el recurso pertenece al usuario
      const resource = await db.get(`
        SELECT ${idColumn} FROM ${tableName} 
        WHERE ${idColumn} = ? AND ${userColumn} = ?
      `, [resourceId, userId]);
      
      if (!resource) {
        return res.status(403).json({ 
          error: `No tienes permisos para acceder a este ${resourceType}` 
        });
      }
      
      next();
      
    } catch (error) {
      console.error(`Error en middleware checkResourceOwnership (${resourceType}):`, error);
      logToFile('error', `Error en middleware checkResourceOwnership`, error.message);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para validar sesión activa
const validateSession = async (req, res, next) => {
  try {
    // En una implementación real, verificarías la sesión en la base de datos
    // Por simplicidad, solo verificamos el token JWT (ya hecho en authenticate)
    next();
    
  } catch (error) {
    console.error('Error en middleware validateSession:', error);
    logToFile('error', 'Error en middleware validateSession', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isPremium,
  requirePhoneVerification,
  rateLimitByUser,
  checkResourceOwnership,
  validateSession
};
