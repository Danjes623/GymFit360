const { Router } = require('express');
const { body, param } = require('express-validator');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, p.referencia, p.observaciones,
              p.membresia_id, p.afiliado_id, a.nombre AS afiliado, tm.nombre AS membresia
       FROM pagos p
        JOIN afiliados a ON a.id = p.afiliado_id
        JOIN membresias m ON m.id = p.membresia_id
        JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
        WHERE p.admin_id = ?
        ORDER BY p.fecha_pago DESC`,
      [req.user.admin_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:id',
  [param('id').isInt().withMessage('ID inválido')],
  validate,
  async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, p.referencia, p.observaciones,
                p.membresia_id, p.afiliado_id, a.nombre AS afiliado, tm.nombre AS membresia
         FROM pagos p
         JOIN afiliados a ON a.id = p.afiliado_id
         JOIN membresias m ON m.id = p.membresia_id
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE p.id = ? AND p.admin_id = ?`,
        [req.params.id, req.user.admin_id]
      );
      if (!rows[0]) {
        return res.status(404).json({ success: false, error: 'Pago no encontrado' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  [
    body('membresia_id')
      .isInt({ min: 1 }).withMessage('Selecciona una membresía'),
    body('afiliado_id')
      .isInt({ min: 1 }).withMessage('Selecciona un afiliado'),
    body('monto')
      .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    body('metodo_pago')
      .trim()
      .notEmpty().withMessage('Selecciona un método de pago')
      .isIn(['efectivo', 'tarjeta', 'transferencia', 'otro'])
      .withMessage('Método de pago inválido'),
    body('referencia')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('observaciones')
      .optional({ values: 'falsy' })
      .trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { membresia_id, afiliado_id, monto, metodo_pago, referencia, observaciones } = req.body;

      const { admin_id } = req.user;

      const [membresia] = await pool.query(
        'SELECT id FROM membresias WHERE id = ? AND afiliado_id = ? AND admin_id = ?',
        [membresia_id, afiliado_id, admin_id]
      );
      if (!membresia[0]) {
        return res.status(400).json({ success: false, error: 'La membresía no existe o no pertenece al afiliado' });
      }

      const [result] = await pool.query(
        `INSERT INTO pagos (membresia_id, afiliado_id, monto, metodo_pago, referencia, observaciones, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [membresia_id, afiliado_id, monto, metodo_pago, referencia || null, observaciones || null, admin_id]
      );

      const [rows] = await pool.query(
        `SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, p.referencia, p.observaciones,
                p.membresia_id, p.afiliado_id, a.nombre AS afiliado, tm.nombre AS membresia
         FROM pagos p
         JOIN afiliados a ON a.id = p.afiliado_id
         JOIN membresias m ON m.id = p.membresia_id
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE p.id = ? AND p.admin_id = ?`,
        [result.insertId, admin_id]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('ID inválido')],
  validate,
  async (req, res, next) => {
    try {
      const [result] = await pool.query('DELETE FROM pagos WHERE id = ? AND admin_id = ?', [req.params.id, req.user.admin_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Pago no encontrado' });
      }
      res.json({ success: true, message: 'Pago eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
