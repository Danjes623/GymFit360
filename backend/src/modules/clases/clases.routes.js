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
      `SELECT c.id, c.nombre, c.descripcion, c.entrenador_id, e.nombre AS entrenador,
              c.horario, c.duracion_minutos, c.cupo_maximo, c.activa,
              (SELECT COUNT(*) FROM inscripciones_clases ic WHERE ic.clase_id = c.id AND ic.estado = 'activa') AS cupo_actual
       FROM clases c
       JOIN entrenadores e ON e.id = c.entrenador_id
       WHERE c.admin_id = ?
       ORDER BY c.horario`,
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
      const [clases] = await pool.query(
        `SELECT c.id, c.nombre, c.descripcion, c.entrenador_id, e.nombre AS entrenador,
                c.horario, c.duracion_minutos, c.cupo_maximo, c.activa
         FROM clases c
         JOIN entrenadores e ON e.id = c.entrenador_id
          WHERE c.id = ? AND c.admin_id = ?`,
        [req.params.id, req.user.admin_id]
      );

      if (!clases[0]) {
        return res.status(404).json({ success: false, error: 'Clase no encontrada' });
      }

      const [inscritos] = await pool.query(
        `SELECT ic.id AS inscripcion_id, ic.afiliado_id, a.nombre AS afiliado, ic.fecha_inscripcion, ic.estado
         FROM inscripciones_clases ic
         JOIN afiliados a ON a.id = ic.afiliado_id
         WHERE ic.clase_id = ? AND ic.admin_id = ?
         ORDER BY a.nombre`,
        [req.params.id, req.user.admin_id]
      );

      res.json({ success: true, data: { ...clases[0], inscritos } });
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
    body('descripcion')
      .optional({ values: 'falsy' })
      .trim(),
    body('entrenador_id')
      .isInt({ min: 1 }).withMessage('Selecciona un entrenador'),
    body('horario')
      .isISO8601().withMessage('Horario inválido (formato ISO8601 requerido)'),
    body('duracion_minutos')
      .optional()
      .isInt({ min: 1 }).withMessage('La duración debe ser mayor a 0'),
    body('cupo_maximo')
      .isInt({ min: 1 }).withMessage('El cupo máximo debe ser mayor a 0'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, descripcion, entrenador_id, horario, duracion_minutos, cupo_maximo } = req.body;

      const [entrenador] = await pool.query(
        'SELECT id FROM entrenadores WHERE id = ? AND activo = 1',
        [entrenador_id]
      );
      if (!entrenador[0]) {
        return res.status(400).json({ success: false, error: 'Entrenador no encontrado o inactivo' });
      }

      const [result] = await pool.query(
        `INSERT INTO clases (nombre, descripcion, entrenador_id, horario, duracion_minutos, cupo_maximo, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, descripcion || null, entrenador_id, horario, duracion_minutos || 60, cupo_maximo, req.user.admin_id]
      );

      const [rows] = await pool.query(
        `SELECT c.id, c.nombre, c.descripcion, c.entrenador_id, e.nombre AS entrenador,
                c.horario, c.duracion_minutos, c.cupo_maximo, c.activa
         FROM clases c
         JOIN entrenadores e ON e.id = c.entrenador_id
          WHERE c.id = ? AND c.admin_id = ?`,
        [result.insertId, req.user.admin_id]
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
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('descripcion')
      .optional({ values: 'falsy' })
      .trim(),
    body('entrenador_id')
      .isInt({ min: 1 }).withMessage('Selecciona un entrenador'),
    body('horario')
      .isISO8601().withMessage('Horario inválido (formato ISO8601 requerido)'),
    body('duracion_minutos')
      .optional()
      .isInt({ min: 1 }).withMessage('La duración debe ser mayor a 0'),
    body('cupo_maximo')
      .isInt({ min: 1 }).withMessage('El cupo máximo debe ser mayor a 0'),
    body('activa')
      .optional()
      .isIn([0, 1]).withMessage('El campo activa debe ser 0 o 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, descripcion, entrenador_id, horario, duracion_minutos, cupo_maximo, activa } = req.body;

      const [result] = await pool.query(
        `UPDATE clases
         SET nombre = ?, descripcion = ?, entrenador_id = ?, horario = ?,
             duracion_minutos = ?, cupo_maximo = ?, activa = ?
          WHERE id = ? AND admin_id = ?`,
        [nombre, descripcion || null, entrenador_id, horario, duracion_minutos || 60, cupo_maximo, activa ?? 1, req.params.id, req.user.admin_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Clase no encontrada' });
      }

      const [rows] = await pool.query(
        `SELECT c.id, c.nombre, c.descripcion, c.entrenador_id, e.nombre AS entrenador,
                c.horario, c.duracion_minutos, c.cupo_maximo, c.activa
         FROM clases c
         JOIN entrenadores e ON e.id = c.entrenador_id
         WHERE c.id = ? AND c.admin_id = ?`,
        [req.params.id, req.user.admin_id]
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
      const [inscripciones] = await pool.query(
        "SELECT COUNT(*) AS total FROM inscripciones_clases WHERE clase_id = ? AND estado = 'activa'",
        [req.params.id]
      );

      if (inscripciones[0].total > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar la clase porque tiene inscripciones activas',
        });
      }

      await pool.query('DELETE FROM inscripciones_clases WHERE clase_id = ? AND admin_id = ?', [req.params.id, req.user.admin_id]);
      const [result] = await pool.query('DELETE FROM clases WHERE id = ? AND admin_id = ?', [req.params.id, req.user.admin_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Clase no encontrada' });
      }

      res.json({ success: true, message: 'Clase eliminada correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/inscribir',
  [
    param('id').isInt().withMessage('ID de clase inválido'),
    body('afiliado_id')
      .isInt({ min: 1 }).withMessage('Selecciona un afiliado'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const claseId = req.params.id;
      const { afiliado_id } = req.body;

      const [clase] = await pool.query(
        `SELECT c.id, c.cupo_maximo,
                (SELECT COUNT(*) FROM inscripciones_clases ic WHERE ic.clase_id = c.id AND ic.estado = 'activa') AS cupo_actual
         FROM clases c WHERE c.id = ? AND c.activa = 1 AND c.admin_id = ?`,
        [claseId, req.user.admin_id]
      );
      if (!clase[0]) {
        return res.status(404).json({ success: false, error: 'Clase no encontrada o inactiva' });
      }

      if (clase[0].cupo_actual >= clase[0].cupo_maximo) {
        return res.status(409).json({ success: false, error: 'La clase ha alcanzado el cupo máximo' });
      }

      const [membresia] = await pool.query(
        `SELECT id FROM membresias WHERE afiliado_id = ? AND activa = 1 AND fecha_fin >= CURDATE() AND admin_id = ?`,
        [afiliado_id, req.user.admin_id]
      );
      if (!membresia[0]) {
        return res.status(403).json({ success: false, error: 'Debes tener una membresía activa para inscribirte' });
      }

      const [result] = await pool.query(
        `INSERT INTO inscripciones_clases (afiliado_id, clase_id, estado, admin_id)
         VALUES (?, ?, 'activa', ?)`,
        [afiliado_id, claseId, req.user.admin_id]
      );

      const [inscripcion] = await pool.query(
        `SELECT ic.id, ic.afiliado_id, a.nombre AS afiliado, ic.fecha_inscripcion, ic.estado
         FROM inscripciones_clases ic
         JOIN afiliados a ON a.id = ic.afiliado_id
         WHERE ic.id = ?`,
        [result.insertId]
      );

      res.status(201).json({ success: true, data: inscripcion[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El afiliado ya está inscrito en esta clase' });
      }
      next(err);
    }
  }
);

router.delete(
  '/:id/inscribir/:afiliadoId',
  [
    param('id').isInt().withMessage('ID de clase inválido'),
    param('afiliadoId').isInt().withMessage('ID de afiliado inválido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM inscripciones_clases WHERE clase_id = ? AND afiliado_id = ? AND estado = 'activa'",
        [req.params.id, req.params.afiliadoId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
      }

      res.json({ success: true, message: 'Afiliado desinscrito correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
