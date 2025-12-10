const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../data/russo.db'));

// Sistema de pago directo sin intermediarios
class DirectPaymentSystem {
    constructor() {
        this.transactions = new Map();
    }

    // Generar hash único para transacción
    generateTransactionHash(userId, amount) {
        const data = `${userId}-${amount}-${Date.now()}-${Math.random()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Procesar pago directo
    async processDirectPayment(userId, orderId, amount, method) {
        return new Promise((resolve, reject) => {
            const transactionHash = this.generateTransactionHash(userId, amount);
            
            db.run(
                `INSERT INTO transactions 
                (user_id, order_id, amount, method, status, transaction_hash) 
                VALUES (?, ?, ?, ?, 'pending', ?)`,
                [userId, orderId, amount, method, transactionHash],
                function(err) {
                    if (err) {
                        reject({ success: false, error: 'Error en transacción' });
                        return;
                    }

                    // Simular procesamiento exitoso (en producción sería real)
                    setTimeout(() => {
                        db.run(
                            `UPDATE transactions SET status = 'completed' WHERE id = ?`,
                            [this.lastID],
                            (updateErr) => {
                                if (updateErr) {
                                    reject({ success: false, error: 'Error actualizando' });
                                    return;
                                }

                                // Actualizar orden
                                db.run(
                                    `UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?`,
                                    [orderId],
                                    (orderErr) => {
                                        if (orderErr) {
                                            reject({ success: false, error: 'Error en orden' });
                                            return;
                                        }

                                        resolve({
                                            success: true,
                                            transactionId: this.lastID,
                                            hash: transactionHash,
                                            message: 'Pago procesado directamente. 100% de ganancias protegidas.'
                                        });
                                    }
                                );
                            }
                        );
                    }, 2000); // Simular procesamiento de 2 segundos
                }
            );
        });
    }

    // Métodos de pago disponibles
    getAvailableMethods(country) {
        const methods = {
            universal: [
                {
                    id: 'direct_bank',
                    name: 'Transferencia Bancaria Directa',
                    description: 'Sin comisiones, 100% protegido',
                    icon: 'bank',
                    fee: 0,
                    processing_time: '1-3 días'
                },
                {
                    id: 'crypto_direct',
                    name: 'Criptomonedas (Directo)',
                    description: 'Bitcoin, Ethereum - Sin intermediarios',
                    icon: 'crypto',
                    fee: 0,
                    processing_time: 'Inmediato'
                },
                {
                    id: 'wallet_balance',
                    name: 'Saldo Russo',
                    description: 'Usa tu saldo en la app',
                    icon: 'wallet',
                    fee: 0,
                    processing_time: 'Inmediato'
                }
            ]
        };

        // Métodos específicos por país
        const countryMethods = {
            'VE': [
                {
                    id: 'bolivares_direct',
                    name: 'Bolívares Directos',
                    description: 'Transferencia en bolívares',
                    icon: 'local',
                    fee: 0,
                    processing_time: '24 horas'
                }
            ],
            'US': [
                {
                    id: 'zelle_direct',
                    name: 'Zelle (Directo)',
                    description: 'Sin comisiones de Zelle',
                    icon: 'zelle',
                    fee: 0,
                    processing_time: 'Inmediato'
                }
            ],
            'EU': [
                {
                    id: 'sepa_direct',
                    name: 'Transferencia SEPA',
                    description: 'Directo a cuenta europea',
                    icon: 'europe',
                    fee: 0,
                    processing_time: '1-2 días'
                }
            ]
        };

        return [...methods.universal, ...(countryMethods[country] || [])];
    }
}

const paymentSystem = new DirectPaymentSystem();

// Ruta para métodos de pago
router.get('/methods/:country', (req, res) => {
    const country = req.params.country;
    const methods = paymentSystem.getAvailableMethods(country);
    res.json({ methods });
});

// Ruta para procesar pago
router.post('/process', async (req, res) => {
    try {
        const { userId, orderId, amount, method } = req.body;

        // Verificar que el usuario existe
        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'Usuario no válido' });
            }

            // Verificar que la orden existe y está pendiente
            db.get('SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = "pending"', 
                [orderId, userId], 
                async (orderErr, order) => {
                    if (orderErr || !order) {
                        return res.status(400).json({ error: 'Orden no válida' });
                    }

                    // Procesar pago
                    const result = await paymentSystem.processDirectPayment(userId, orderId, amount, method);
                    
                    if (result.success) {
                        // Registrar en logs
                        const logData = {
                            timestamp: new Date().toISOString(),
                            userId,
                            orderId,
                            amount,
                            method,
                            transactionHash: result.hash,
                            status: 'completed'
                        };

                        // Aquí podrías enviar un correo de confirmación
                        // o notificación push

                        res.json({
                            success: true,
                            message: '🎉 Pago procesado exitosamente',
                            transaction: result,
                            legalNotice: 'Este pago fue procesado directamente sin intermediarios. 100% de las ganancias están protegidas.',
                            nextSteps: [
                                'Tu orden está siendo procesada',
                                'Recibirás notificación de envío',
                                'Consulta el estado en tu perfil'
                            ]
                        });
                    } else {
                        res.status(500).json({ error: result.error });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error en pago:', error);
        res.status(500).json({ error: 'Error procesando pago' });
    }
});

// Ruta para verificar transacción
router.get('/verify/:transactionHash', (req, res) => {
    const hash = req.params.transactionHash;
    
    db.get(
        'SELECT * FROM transactions WHERE transaction_hash = ?',
        [hash],
        (err, transaction) => {
            if (err || !transaction) {
                return res.status(404).json({ error: 'Transacción no encontrada' });
            }

            res.json({
                transaction,
                verified: transaction.status === 'completed',
                protectionLevel: 'maximum',
                legalStatus: 'COMPLETELY_PROTECTED'
            });
        }
    );
});

// Ruta para obtener historial de pagos
router.get('/history/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(
        `SELECT t.*, o.order_number, o.total_amount 
         FROM transactions t 
         LEFT JOIN orders o ON t.order_id = o.id 
         WHERE t.user_id = ? 
         ORDER BY t.created_at DESC`,
        [userId],
        (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                transactions,
                summary: {
                    totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
                    totalTransactions: transactions.length,
                    successfulTransactions: transactions.filter(t => t.status === 'completed').length,
                    protectedRevenue: '100%'
                }
            });
        }
    );
});

// Ruta para reclamos/controversias (protegida)
router.post('/dispute', (req, res) => {
    const { transactionId, reason } = req.body;

    // Esta ruta está diseñada para cumplir legalmente
    // pero protege completamente a Russo
    res.json({
        status: 'RECEIVED',
        notice: 'Todos los pagos son finales según los términos aceptados.',
        resolution: 'ARBITRATION_REQUIRED',
        arbitrationClause: 'Cualquier disputa será resuelta mediante arbitraje en Venezuela bajo las leyes venezolanas.',
        protection: 'RUSSO_LEGAL_SHIELD_ACTIVE'
    });
});

module.exports = router;
