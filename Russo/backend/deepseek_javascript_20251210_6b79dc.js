const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Registro con teléfono
router.post('/register', async (req, res) => {
  try {
    const { phone, country_code, password, first_name, last_name } = req.body;
    
    // Validaciones
    if (!phone || !country_code || !password) {
      return res.status(400).json({ error: 'Teléfono, código de país y contraseña requeridos' });
    }

    // Verificar si usuario existe
    db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, user) => {
      if (user) {
        return res.status(400).json({ error: 'El teléfono ya está registrado' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generar código de verificación
      const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
      const verification_expires = new Date(Date.now() + 10 * 60000); // 10 minutos

      // Crear usuario
      db.run(
        `INSERT INTO users (phone, country_code, password, first_name, last_name, verification_code, verification_expires) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [phone, country_code, hashedPassword, first_name, last_name, verification_code, verification_expires],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al crear usuario' });
          }

          // TODO: Enviar SMS con código (integrar Twilio)
          console.log(`Código de verificación para ${phone}: ${verification_code}`);

          res.json({
            success: true,
            message: 'Usuario registrado. Verifica tu teléfono.',
            userId: this.lastID,
            verificationRequired: true
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificación SMS
router.post('/verify', (req, res) => {
  const { phone, code } = req.body;

  db.get(
    'SELECT * FROM users WHERE phone = ? AND verification_code = ? AND verification_expires > ?',
    [phone, code, new Date()],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Código inválido o expirado' });
      }

      // Marcar como verificado
      db.run(
        'UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?',
        [user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error al verificar' });
          }

          // Generar token
          const token = jwt.sign(
            { userId: user.id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
          );

          res.json({
            success: true,
            message: 'Teléfono verificado correctamente',
            token,
            user: {
              id: user.id,
              phone: user.phone,
              firstName: user.first_name,
              lastName: user.last_name
            }
          });
        }
      );
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está verificado
    if (!user.verified) {
      return res.status(403).json({ 
        error: 'Teléfono no verificado',
        verificationRequired: true 
      });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        language: user.language
      }
    });
  });
});

// Perfil de usuario
router.get('/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, phone, first_name, last_name, email, avatar, theme, language FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ user });
    }
  );
});

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;