const { Router } = require('express');
const { body, param } = require('express-validator');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM planes_admin WHERE activo = 1 ORDER BY precio'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/todas',
  authenticateToken,
  async (_req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo, creado_en, actualizado_en FROM planes_admin ORDER BY activo DESC, precio'
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  [param('id').isInt().withMessage('ID inválido')],
  validate,
  async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM planes_admin WHERE id = ?',
        [req.params.id]
      );
      if (!rows[0]) {
        return res.status(404).json({ success: false, error: 'Plan no encontrado' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticateToken,
  [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('duracion_dias')
      .isInt({ min: 1 }).withMessage('La duración debe ser un número positivo de días'),
    body('precio')
      .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0'),
    body('descripcion')
      .optional({ values: 'falsy' })
      .trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo administradores pueden gestionar planes' });
      }

      const { nombre, duracion_dias, precio, descripcion } = req.body;

      const [result] = await pool.query(
        'INSERT INTO planes_admin (nombre, duracion_dias, precio, descripcion) VALUES (?, ?, ?, ?)',
        [nombre, duracion_dias, precio, descripcion || null]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM planes_admin WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('duracion_dias')
      .isInt({ min: 1 }).withMessage('La duración debe ser un número positivo de días'),
    body('precio')
      .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0'),
    body('descripcion')
      .optional({ values: 'falsy' })
      .trim(),
    body('activo')
      .optional()
      .isIn([0, 1]).withMessage('El campo activo debe ser 0 o 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo administradores pueden gestionar planes' });
      }

      const { nombre, duracion_dias, precio, descripcion, activo } = req.body;

      const [result] = await pool.query(
        'UPDATE planes_admin SET nombre = ?, duracion_dias = ?, precio = ?, descripcion = ?, activo = ? WHERE id = ?',
        [nombre, duracion_dias, precio, descripcion || null, activo ?? 1, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Plan no encontrado' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM planes_admin WHERE id = ?',
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
  authenticateToken,
  [param('id').isInt().withMessage('ID inválido')],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo administradores pueden gestionar planes' });
      }

      const [suscripciones] = await pool.query(
        'SELECT COUNT(*) AS total FROM suscripciones_admin WHERE plan_admin_id = ?',
        [req.params.id]
      );

      if (suscripciones[0].total > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar el plan porque tiene suscripciones asociadas',
        });
      }

      const [result] = await pool.query('DELETE FROM planes_admin WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Plan no encontrado' });
      }

      res.json({ success: true, message: 'Plan eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
