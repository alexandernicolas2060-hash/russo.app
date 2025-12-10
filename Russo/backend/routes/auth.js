const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sendVerificationSMS, verifySMSCode } = require('../utils/smsService');
const { logToFile } = require('../utils/logger');
const db = require('../config/database');

// Middleware de validación
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// REGISTRO DE USUARIO
router.post('/register', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener mayúsculas, minúsculas y números'),
    body('firstName').optional().isLength({ min: 2 }).withMessage('Nombre inválido'),
    body('lastName').optional().isLength({ min: 2 }).withMessage('Apellido inválido'),
    body('countryCode').isLength({ min: 2, max: 4 }).withMessage('Código de país inválido')
], validateRequest, async (req, res) => {
    try {
        const { phone, password, firstName, lastName, countryCode } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await db.get(`
            SELECT id FROM users WHERE phone = ?
        `, [phone]);
        
        if (existingUser) {
            return res.status(400).json({
                error: 'Este número de teléfono ya está registrado'
            });
        }
        
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generar código de verificación
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Insertar usuario en base de datos
        const result = await db.run(`
            INSERT INTO users (phone, password, first_name, last_name, country_code, 
                            verification_code, verification_sent_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [phone, hashedPassword, firstName, lastName, countryCode, verificationCode]);
        
        // Enviar SMS de verificación
        const smsResult = await sendVerificationSMS(phone, verificationCode);
        
        if (!smsResult.success) {
            // Si falla el SMS, eliminar el usuario creado
            await db.run('DELETE FROM users WHERE id = ?', [result.lastID]);
            
            return res.status(500).json({
                error: 'Error al enviar código de verificación',
                details: smsResult.error
            });
        }
        
        // Registrar en logs
        logToFile('info', `Usuario registrado: ${phone}`, {
            userId: result.lastID,
            country: countryCode
        });
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente. Verifica tu teléfono.',
            userId: result.lastID,
            requiresVerification: true
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        logToFile('error', 'Error en registro de usuario', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// VERIFICACIÓN DE SMS
router.post('/verify', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código inválido')
], validateRequest, async (req, res) => {
    try {
        const { phone, code } = req.body;
        
        // Buscar usuario
        const user = await db.get(`
            SELECT id, verification_code, verification_sent_at
            FROM users WHERE phone = ?
        `, [phone]);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Verificar código (simplificado - en producción usar servicio SMS real)
        if (user.verification_code !== code) {
            // Verificar expiración (15 minutos)
            const sentAt = new Date(user.verification_sent_at);
            const now = new Date();
            const diffMinutes = (now - sentAt) / (1000 * 60);
            
            if (diffMinutes > 15) {
                return res.status(400).json({ error: 'Código expirado' });
            }
            
            return res.status(400).json({ error: 'Código de verificación incorrecto' });
        }
        
        // Actualizar usuario como verificado
        await db.run(`
            UPDATE users 
            SET verified = 1, 
                verification_code = NULL,
                verified_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `, [user.id]);
        
        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id, phone: phone },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        logToFile('info', `Usuario verificado: ${phone}`, { userId: user.id });
        
        res.json({
            success: true,
            message: 'Teléfono verificado exitosamente',
            token,
            user: {
                id: user.id,
                phone: phone,
                verified: true
            }
        });
        
    } catch (error) {
        console.error('Error en verificación:', error);
        logToFile('error', 'Error en verificación SMS', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// LOGIN
router.post('/login', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida')
], validateRequest, async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        // Buscar usuario
        const user = await db.get(`
            SELECT id, phone, password, verified, first_name, last_name, 
                   country_code, created_at
            FROM users WHERE phone = ?
        `, [phone]);
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        // Verificar si el usuario está verificado
        if (!user.verified) {
            return res.status(403).json({
                error: 'Teléfono no verificado',
                requiresVerification: true
            });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                phone: user.phone,
                country: user.country_code 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        // Actualizar último login
        await db.run(`
            UPDATE users 
            SET last_login = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `, [user.id]);
        
        logToFile('info', `Login exitoso: ${phone}`, { userId: user.id });
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.first_name,
                lastName: user.last_name,
                countryCode: user.country_code,
                verified: user.verified,
                createdAt: user.created_at
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        logToFile('error', 'Error en login', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// REENVIAR CÓDIGO DE VERIFICACIÓN
router.post('/resend-code', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido')
], validateRequest, async (req, res) => {
    try {
        const { phone } = req.body;
        
        // Verificar si el usuario existe
        const user = await db.get(`
            SELECT id, verified FROM users WHERE phone = ?
        `, [phone]);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        if (user.verified) {
            return res.status(400).json({ error: 'Usuario ya verificado' });
        }
        
        // Generar nuevo código
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Actualizar en base de datos
        await db.run(`
            UPDATE users 
            SET verification_code = ?,
                verification_sent_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `, [newCode, user.id]);
        
        // Enviar SMS
        const smsResult = await sendVerificationSMS(phone, newCode);
        
        if (!smsResult.success) {
            return res.status(500).json({
                error: 'Error al enviar código de verificación',
                details: smsResult.error
            });
        }
        
        logToFile('info', `Código reenviado: ${phone}`, { userId: user.id });
        
        res.json({
            success: true,
            message: 'Código de verificación reenviado'
        });
        
    } catch (error) {
        console.error('Error al reenviar código:', error);
        logToFile('error', 'Error al reenviar código SMS', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
router.post('/forgot-password', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido')
], validateRequest, async (req, res) => {
    try {
        const { phone } = req.body;
        
        // Verificar si el usuario existe
        const user = await db.get(`
            SELECT id FROM users WHERE phone = ?
        `, [phone]);
        
        if (!user) {
            // Por seguridad, no revelar si el usuario existe
            return res.json({
                success: true,
                message: 'Si el número está registrado, recibirás un SMS'
            });
        }
        
        // Generar código de recuperación
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código en base de datos
        await db.run(`
            UPDATE users 
            SET reset_password_code = ?,
                reset_password_expires = datetime('now', '+1 hour'),
                updated_at = datetime('now')
            WHERE id = ?
        `, [resetCode, user.id]);
        
        // Enviar SMS con código
        const smsResult = await sendVerificationSMS(phone, 
            `Tu código para restablecer contraseña en Russo es: ${resetCode}. Válido por 1 hora.`
        );
        
        if (!smsResult.success) {
            return res.status(500).json({
                error: 'Error al enviar SMS',
                details: smsResult.error
            });
        }
        
        logToFile('info', `Solicitud de recuperación: ${phone}`, { userId: user.id });
        
        res.json({
            success: true,
            message: 'Se ha enviado un código a tu teléfono'
        });
        
    } catch (error) {
        console.error('Error en recuperación:', error);
        logToFile('error', 'Error en forgot-password', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// VERIFICAR CÓDIGO DE RECUPERACIÓN
router.post('/verify-reset-code', [
    body('phone').isMobilePhone('any').withMessage('Número de teléfono inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código inválido')
], validateRequest, async (req, res) => {
    try {
        const { phone, code } = req.body;
        
        const user = await db.get(`
            SELECT id, reset_password_code, reset_password_expires
            FROM users WHERE phone = ?
        `, [phone]);
        
        if (!user || user.reset_password_code !== code) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }
        
        // Verificar expiración
        const expiresAt = new Date(user.reset_password_expires);
        if (new Date() > expiresAt) {
            return res.status(400).json({ error: 'Código expirado' });
        }
        
        // Generar token temporal para restablecimiento
        const resetToken = jwt.sign(
            { userId: user.id, reset: true },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        
        res.json({
            success: true,
            resetToken,
            message: 'Código verificado correctamente'
        });
        
    } catch (error) {
        console.error('Error en verificación de código:', error);
        logToFile('error', 'Error en verify-reset-code', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RESTABLECER CONTRASEÑA
router.post('/reset-password', [
    body('resetToken').notEmpty().withMessage('Token requerido'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener mayúsculas, minúsculas y números')
], validateRequest, async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        
        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        
        if (!decoded.reset) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        // Hash de nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Actualizar contraseña
        await db.run(`
            UPDATE users 
            SET password = ?,
                reset_password_code = NULL,
                reset_password_expires = NULL,
                updated_at = datetime('now')
            WHERE id = ?
        `, [hashedPassword, decoded.userId]);
        
        logToFile('info', `Contraseña restablecida: usuario ${decoded.userId}`);
        
        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });
        
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        logToFile('error', 'Error en reset-password', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER PERFIL DE USUARIO
router.get('/profile', async (req, res) => {
    try {
        // Este endpoint requiere autenticación
        // La autenticación se maneja con middleware (no incluido en este ejemplo)
        const userId = req.userId; // Asumiendo que el middleware añade userId
        
        const user = await db.get(`
            SELECT id, phone, first_name, last_name, country_code,
                   verified, created_at, last_login
            FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.first_name,
                lastName: user.last_name,
                countryCode: user.country_code,
                verified: user.verified,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
        
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        logToFile('error', 'Error en get profile', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ACTUALIZAR PERFIL
router.put('/profile', [
    body('firstName').optional().isLength({ min: 2 }).withMessage('Nombre inválido'),
    body('lastName').optional().isLength({ min: 2 }).withMessage('Apellido inválido')
], validateRequest, async (req, res) => {
    try {
        const userId = req.userId;
        const { firstName, lastName } = req.body;
        
        // Construir query dinámica
        const updates = [];
        const params = [];
        
        if (firstName !== undefined) {
            updates.push('first_name = ?');
            params.push(firstName);
        }
        
        if (lastName !== undefined) {
            updates.push('last_name = ?');
            params.push(lastName);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }
        
        updates.push('updated_at = datetime("now")');
        params.push(userId);
        
        const query = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;
        
        await db.run(query, params);
        
        logToFile('info', `Perfil actualizado: usuario ${userId}`);
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        logToFile('error', 'Error en update profile', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// CERRAR SESIÓN
router.post('/logout', async (req, res) => {
    try {
        // En una implementación con tokens, el logout se maneja en el cliente
        // eliminando el token. Aquí solo registramos el evento.
        
        const userId = req.userId;
        const userIp = req.ip;
        
        logToFile('info', `Logout: usuario ${userId}`, { ip: userIp });
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
        
    } catch (error) {
        console.error('Error en logout:', error);
        logToFile('error', 'Error en logout', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// VERIFICAR TOKEN (para mantener sesión activa)
router.get('/verify-token', async (req, res) => {
    try {
        // El middleware de autenticación ya verificó el token
        // Solo devolvemos que es válido
        
        res.json({
            success: true,
            valid: true,
            message: 'Token válido'
        });
        
    } catch (error) {
        console.error('Error en verify-token:', error);
        res.status(401).json({ 
            success: false, 
            valid: false, 
            error: 'Token inválido' 
        });
    }
});

module.exports = router;
