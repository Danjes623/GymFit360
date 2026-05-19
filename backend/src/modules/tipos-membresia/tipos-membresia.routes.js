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
      'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM tipos_membresia ORDER BY nombre'
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
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM tipos_membresia WHERE id = ?',
        [req.params.id]
      );
      if (!rows[0]) {
        return res.status(404).json({ success: false, error: 'Tipo de membresía no encontrado' });
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
      const { nombre, duracion_dias, precio, descripcion } = req.body;

      const [result] = await pool.query(
        'INSERT INTO tipos_membresia (nombre, duracion_dias, precio, descripcion) VALUES (?, ?, ?, ?)',
        [nombre, duracion_dias, precio, descripcion || null]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM tipos_membresia WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Ya existe un tipo de membresía con ese nombre' });
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
      const { nombre, duracion_dias, precio, descripcion, activo } = req.body;

      const [result] = await pool.query(
        'UPDATE tipos_membresia SET nombre = ?, duracion_dias = ?, precio = ?, descripcion = ?, activo = ? WHERE id = ?',
        [nombre, duracion_dias, precio, descripcion || null, activo ?? 1, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Tipo de membresía no encontrado' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, duracion_dias, precio, descripcion, activo FROM tipos_membresia WHERE id = ?',
        [req.params.id]
      );

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Ya existe un tipo de membresía con ese nombre' });
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
      const [membresias] = await pool.query(
        'SELECT COUNT(*) AS total FROM membresias WHERE tipo_membresia_id = ?',
        [req.params.id]
      );

      if (membresias[0].total > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar el tipo de membresía porque tiene membresías asignadas',
        });
      }

      const [result] = await pool.query('DELETE FROM tipos_membresia WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Tipo de membresía no encontrado' });
      }

      res.json({ success: true, message: 'Tipo de membresía eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
