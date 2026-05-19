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
      'SELECT id, nombre, email, telefono, especialidad, activo, fecha_ingreso FROM entrenadores ORDER BY nombre'
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
      const [entrenadores] = await pool.query(
        'SELECT id, nombre, email, telefono, especialidad, activo, fecha_ingreso FROM entrenadores WHERE id = ?',
        [req.params.id]
      );

      if (!entrenadores[0]) {
        return res.status(404).json({ success: false, error: 'Entrenador no encontrado' });
      }

      const [clases] = await pool.query(
        `SELECT c.id, c.nombre, c.horario, c.cupo_maximo, c.cupo_actual
         FROM clases c WHERE c.entrenador_id = ? AND c.activa = 1
         ORDER BY c.horario`,
        [req.params.id]
      );

      res.json({ success: true, data: { ...entrenadores[0], clases } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('telefono')
      .optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
    body('especialidad')
      .trim()
      .notEmpty().withMessage('La especialidad es requerida')
      .isLength({ max: 200 }).withMessage('La especialidad no puede exceder 200 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, especialidad } = req.body;

      const [result] = await pool.query(
        'INSERT INTO entrenadores (nombre, email, telefono, especialidad) VALUES (?, ?, ?, ?)',
        [nombre, email, telefono || null, especialidad]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, telefono, especialidad, activo, fecha_ingreso FROM entrenadores WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
      next(err);
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('telefono')
      .optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
    body('especialidad')
      .trim()
      .notEmpty().withMessage('La especialidad es requerida')
      .isLength({ max: 200 }).withMessage('La especialidad no puede exceder 200 caracteres'),
    body('activo')
      .optional()
      .isIn([0, 1]).withMessage('El campo activo debe ser 0 o 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, especialidad, activo } = req.body;

      const [result] = await pool.query(
        `UPDATE entrenadores
         SET nombre = ?, email = ?, telefono = ?, especialidad = ?, activo = ?
         WHERE id = ?`,
        [nombre, email, telefono || null, especialidad, activo ?? 1, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Entrenador no encontrado' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, email, telefono, especialidad, activo, fecha_ingreso FROM entrenadores WHERE id = ?',
        [req.params.id]
      );

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
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
      const [dependencias] = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM clases WHERE entrenador_id = ? AND activa = 1) AS clases_activas,
           (SELECT COUNT(*) FROM planes_entrenamiento WHERE entrenador_id = ? AND activo = 1) AS planes_activos`,
        [req.params.id, req.params.id]
      );

      const dep = dependencias[0];
      if (dep.clases_activas > 0 || dep.planes_activos > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar el entrenador porque tiene clases o planes activos asociados',
          dependencias: dep,
        });
      }

      const [result] = await pool.query('DELETE FROM entrenadores WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Entrenador no encontrado' });
      }

      res.json({ success: true, message: 'Entrenador eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
