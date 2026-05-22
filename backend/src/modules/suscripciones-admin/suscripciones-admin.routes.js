const { Router } = require('express');
const { body } = require('express-validator');
const crypto = require('crypto');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');
const { sendAdminCode } = require('../../services/email');

const router = Router();

router.post(
  '/solicitar',
  [
    body('plan_admin_id')
      .isInt({ min: 1 }).withMessage('Selecciona un plan'),
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { plan_admin_id, nombre, email } = req.body;

      const [usuarioExistente] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );
      if (usuarioExistente[0]) {
        return res.status(409).json({ success: false, error: 'El email ya está registrado en el sistema' });
      }

      const [planes] = await pool.query(
        'SELECT id, nombre, precio FROM planes_admin WHERE id = ? AND activo = 1',
        [plan_admin_id]
      );
      const plan = planes[0];
      if (!plan) {
        return res.status(400).json({ success: false, error: 'Plan no encontrado o inactivo' });
      }

      const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();

      const [result] = await pool.query(
        `INSERT INTO suscripciones_admin (plan_admin_id, email, nombre, monto, metodo_pago, codigo, pagado, pagado_en)
         VALUES (?, ?, ?, ?, 'mock', ?, 1, NOW())`,
        [plan_admin_id, email, nombre, plan.precio, codigo]
      );

      await sendAdminCode({ email, codigo, nombre });

      res.status(201).json({
        success: true,
        message: 'Suscripción procesada. Revisa tu email para obtener el código de activación.',
        data: {
          suscripcion_id: result.insertId,
          email,
        },
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Ya existe una solicitud pendiente para este email' });
      }
      next(err);
    }
  }
);

router.post(
  '/verificar',
  authenticateToken,
  [
    body('codigo')
      .trim()
      .notEmpty().withMessage('El código es requerido'),
    body('suscripcion_id')
      .optional()
      .isInt().withMessage('ID de suscripción inválido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo administradores pueden verificar suscripciones' });
      }

      const { codigo, suscripcion_id } = req.body;

      let query = 'SELECT id, email, nombre, codigo_usado FROM suscripciones_admin WHERE codigo = ? AND pagado = 1';
      const params = [codigo];
      if (suscripcion_id) {
        query += ' AND id = ?';
        params.push(suscripcion_id);
      }

      const [suscripciones] = await pool.query(query, params);
      const suscripcion = suscripciones[0];

      if (!suscripcion) {
        return res.status(400).json({ success: false, error: 'Código inválido' });
      }

      if (suscripcion.codigo_usado) {
        return res.status(400).json({ success: false, error: 'El código ya fue usado' });
      }

      res.json({
        success: true,
        data: suscripcion,
        message: 'Código válido. Puedes completar el registro.',
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
