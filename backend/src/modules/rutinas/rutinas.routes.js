const { Router } = require('express');
const { body, param } = require('express-validator');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

router.get(
  '/plan/:planId',
  [param('planId').isInt().withMessage('ID de plan inválido')],
  validate,
  async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.id, r.nombre, r.series, r.repeticiones, r.peso, r.dia_semana, r.hora, r.orden, r.notas
         FROM rutinas_ejercicio r
         JOIN planes_entrenamiento p ON p.id = r.plan_id
         WHERE r.plan_id = ? AND p.admin_id = ?
         ORDER BY r.dia_semana, r.orden`,
        [req.params.planId, req.user.admin_id]
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  [
    body('plan_id').isInt({ min: 1 }).withMessage('Selecciona un plan'),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 150 }),
    body('series').isInt({ min: 1 }).withMessage('Series debe ser mayor a 0'),
    body('repeticiones').isInt({ min: 1 }).withMessage('Repeticiones debe ser mayor a 0'),
    body('peso').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Peso inválido'),
    body('dia_semana').isInt({ min: 1, max: 7 }).withMessage('Día de semana inválido (1-7)'),
    body('hora').optional({ values: 'falsy' }).matches(/^\d{2}:\d{2}$/).withMessage('Hora inválida (HH:MM)'),
    body('orden').optional().isInt({ min: 0 }),
    body('notas').optional({ values: 'falsy' }).trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { plan_id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas } = req.body;

      const [plan] = await pool.query(
        'SELECT id FROM planes_entrenamiento WHERE id = ? AND admin_id = ?',
        [plan_id, req.user.admin_id]
      );
      if (!plan[0]) {
        return res.status(400).json({ success: false, error: 'El plan no existe o no pertenece a tu gimnasio' });
      }

      const [result] = await pool.query(
        `INSERT INTO rutinas_ejercicio (plan_id, admin_id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan_id, req.user.admin_id, nombre, series, repeticiones, peso || null, dia_semana, hora || null, orden ?? 0, notas || null]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas FROM rutinas_ejercicio WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Registro duplicado' });
      }
      next(err);
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 150 }),
    body('series').isInt({ min: 1 }).withMessage('Series debe ser mayor a 0'),
    body('repeticiones').isInt({ min: 1 }).withMessage('Repeticiones debe ser mayor a 0'),
    body('peso').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('dia_semana').isInt({ min: 1, max: 7 }).withMessage('Día de semana inválido (1-7)'),
    body('hora').optional({ values: 'falsy' }).matches(/^\d{2}:\d{2}$/),
    body('orden').optional().isInt({ min: 0 }),
    body('notas').optional({ values: 'falsy' }).trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, series, repeticiones, peso, dia_semana, hora, orden, notas } = req.body;

      const [result] = await pool.query(
        `UPDATE rutinas_ejercicio r
         JOIN planes_entrenamiento p ON p.id = r.plan_id
         SET r.nombre = ?, r.series = ?, r.repeticiones = ?, r.peso = ?, r.dia_semana = ?, r.hora = ?, r.orden = ?, r.notas = ?, r.actualizado_en = NOW()
         WHERE r.id = ? AND p.admin_id = ?`,
        [nombre, series, repeticiones, peso || null, dia_semana, hora || null, orden ?? 0, notas || null, req.params.id, req.user.admin_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Ejercicio no encontrado' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas FROM rutinas_ejercicio WHERE id = ?',
        [req.params.id]
      );

      res.json({ success: true, data: rows[0] });
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
      const [result] = await pool.query(
        'DELETE r FROM rutinas_ejercicio r JOIN planes_entrenamiento p ON p.id = r.plan_id WHERE r.id = ? AND p.admin_id = ?',
        [req.params.id, req.user.admin_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Ejercicio no encontrado' });
      }

      res.json({ success: true, message: 'Ejercicio eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
