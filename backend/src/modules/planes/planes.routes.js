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
      `SELECT p.id, p.nombre, p.descripcion, p.objetivo,
              p.fecha_inicio, p.fecha_fin, p.activo,
              p.afiliado_id, a.nombre AS afiliado,
              p.entrenador_id, e.nombre AS entrenador
       FROM planes_entrenamiento p
        JOIN afiliados a ON a.id = p.afiliado_id
        JOIN entrenadores e ON e.id = p.entrenador_id
        WHERE p.admin_id = ?
        ORDER BY p.creado_en DESC`,
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
        `SELECT p.id, p.nombre, p.descripcion, p.objetivo,
                p.fecha_inicio, p.fecha_fin, p.activo,
                p.afiliado_id, a.nombre AS afiliado,
                p.entrenador_id, e.nombre AS entrenador
         FROM planes_entrenamiento p
         JOIN afiliados a ON a.id = p.afiliado_id
         JOIN entrenadores e ON e.id = p.entrenador_id
         WHERE p.id = ? AND p.admin_id = ?`,
        [req.params.id, req.user.admin_id]
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
  [
    body('afiliado_id')
      .isInt({ min: 1 }).withMessage('Selecciona un afiliado'),
    body('entrenador_id')
      .isInt({ min: 1 }).withMessage('Selecciona un entrenador'),
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('descripcion')
      .trim()
      .notEmpty().withMessage('La descripción es requerida'),
    body('objetivo')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
    body('fecha_inicio')
      .isDate().withMessage('Fecha de inicio inválida'),
    body('fecha_fin')
      .optional({ values: 'falsy' })
      .isDate().withMessage('Fecha de fin inválida'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { afiliado_id, entrenador_id, nombre, descripcion, objetivo, fecha_inicio, fecha_fin } = req.body;

      const { admin_id } = req.user;

      const [entrenadores] = await pool.query(
        'SELECT activo FROM entrenadores WHERE id = ? AND admin_id = ?',
        [entrenador_id, admin_id]
      );
      if (!entrenadores[0]) {
        return res.status(404).json({ success: false, error: 'Entrenador no encontrado' });
      }
      if (!entrenadores[0].activo) {
        return res.status(400).json({ success: false, error: 'No se puede asignar un plan a un entrenador inactivo' });
      }

      const [result] = await pool.query(
        `INSERT INTO planes_entrenamiento (afiliado_id, entrenador_id, nombre, descripcion, objetivo, fecha_inicio, fecha_fin, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [afiliado_id, entrenador_id, nombre, descripcion, objetivo || null, fecha_inicio, fecha_fin || null, admin_id]
      );

      const [rows] = await pool.query(
        `SELECT p.id, p.nombre, p.descripcion, p.objetivo,
                p.fecha_inicio, p.fecha_fin, p.activo,
                p.afiliado_id, a.nombre AS afiliado,
                p.entrenador_id, e.nombre AS entrenador
         FROM planes_entrenamiento p
         JOIN afiliados a ON a.id = p.afiliado_id
         JOIN entrenadores e ON e.id = p.entrenador_id
         WHERE p.id = ? AND p.admin_id = ?`,
        [result.insertId, admin_id]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
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
      .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('descripcion')
      .trim()
      .notEmpty().withMessage('La descripción es requerida'),
    body('objetivo')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
    body('fecha_inicio')
      .isDate().withMessage('Fecha de inicio inválida'),
    body('fecha_fin')
      .optional({ values: 'falsy' })
      .isDate().withMessage('Fecha de fin inválida'),
    body('activo')
      .optional()
      .isIn([0, 1]).withMessage('El campo activo debe ser 0 o 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, descripcion, objetivo, fecha_inicio, fecha_fin, activo } = req.body;

      const { admin_id } = req.user;

      const [result] = await pool.query(
        `UPDATE planes_entrenamiento
         SET nombre = ?, descripcion = ?, objetivo = ?, fecha_inicio = ?, fecha_fin = ?, activo = ?
         WHERE id = ? AND admin_id = ?`,
        [nombre, descripcion, objetivo || null, fecha_inicio, fecha_fin || null, activo ?? 1, req.params.id, admin_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Plan no encontrado' });
      }

      const [rows] = await pool.query(
        `SELECT p.id, p.nombre, p.descripcion, p.objetivo,
                p.fecha_inicio, p.fecha_fin, p.activo,
                p.afiliado_id, a.nombre AS afiliado,
                p.entrenador_id, e.nombre AS entrenador
         FROM planes_entrenamiento p
         JOIN afiliados a ON a.id = p.afiliado_id
         JOIN entrenadores e ON e.id = p.entrenador_id
         WHERE p.id = ? AND p.admin_id = ?`,
        [req.params.id, admin_id]
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
      const [result] = await pool.query('DELETE FROM planes_entrenamiento WHERE id = ? AND admin_id = ?', [req.params.id, req.user.admin_id]);

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
