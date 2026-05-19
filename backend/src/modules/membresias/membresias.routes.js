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
      `SELECT m.id, m.afiliado_id, a.nombre AS afiliado, m.tipo_membresia_id,
              tm.nombre AS tipo_membresia, m.fecha_inicio, m.fecha_fin, m.activa, m.observaciones
       FROM membresias m
       JOIN afiliados a ON a.id = m.afiliado_id
       JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
       ORDER BY m.fecha_inicio DESC`
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
        `SELECT m.id, m.afiliado_id, a.nombre AS afiliado, m.tipo_membresia_id,
                tm.nombre AS tipo_membresia, m.fecha_inicio, m.fecha_fin, m.activa, m.observaciones
         FROM membresias m
         JOIN afiliados a ON a.id = m.afiliado_id
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE m.id = ?`,
        [req.params.id]
      );
      if (!rows[0]) {
        return res.status(404).json({ success: false, error: 'Membresía no encontrada' });
      }

      const [pagos] = await pool.query(
        `SELECT id, monto, fecha_pago, metodo_pago, referencia
         FROM pagos WHERE membresia_id = ? ORDER BY fecha_pago DESC`,
        [req.params.id]
      );

      res.json({ success: true, data: { ...rows[0], pagos } });
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
    body('tipo_membresia_id')
      .isInt({ min: 1 }).withMessage('Selecciona un tipo de membresía'),
    body('fecha_inicio')
      .isDate().withMessage('Fecha de inicio inválida'),
    body('observaciones')
      .optional({ values: 'falsy' })
      .trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { afiliado_id, tipo_membresia_id, fecha_inicio, observaciones } = req.body;

      const [tipo] = await pool.query(
        'SELECT duracion_dias FROM tipos_membresia WHERE id = ? AND activo = 1',
        [tipo_membresia_id]
      );
      if (!tipo[0]) {
        return res.status(400).json({ success: false, error: 'Tipo de membresía no encontrado o inactivo' });
      }

      await pool.query(
        'UPDATE membresias SET activa = 0 WHERE afiliado_id = ? AND activa = 1',
        [afiliado_id]
      );

      const [result] = await pool.query(
        `INSERT INTO membresias (afiliado_id, tipo_membresia_id, fecha_inicio, fecha_fin, observaciones)
         VALUES (?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), ?)`,
        [afiliado_id, tipo_membresia_id, fecha_inicio, fecha_inicio, tipo[0].duracion_dias, observaciones || null]
      );

      const [rows] = await pool.query(
        `SELECT m.id, m.afiliado_id, a.nombre AS afiliado, m.tipo_membresia_id,
                tm.nombre AS tipo_membresia, m.fecha_inicio, m.fecha_fin, m.activa, m.observaciones
         FROM membresias m
         JOIN afiliados a ON a.id = m.afiliado_id
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE m.id = ?`,
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
  [
    param('id').isInt().withMessage('ID inválido'),
    body('tipo_membresia_id')
      .optional()
      .isInt({ min: 1 }).withMessage('Selecciona un tipo de membresía'),
    body('fecha_inicio')
      .optional()
      .isDate().withMessage('Fecha de inicio inválida'),
    body('fecha_fin')
      .optional()
      .isDate().withMessage('Fecha de fin inválida'),
    body('activa')
      .optional()
      .isIn([0, 1]).withMessage('El campo activa debe ser 0 o 1'),
    body('observaciones')
      .optional({ values: 'falsy' })
      .trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { tipo_membresia_id, fecha_inicio, fecha_fin, activa, observaciones } = req.body;

      const campos = [];
      const params = [];

      if (tipo_membresia_id !== undefined) {
        campos.push('tipo_membresia_id = ?');
        params.push(tipo_membresia_id);
      }
      if (fecha_inicio !== undefined) {
        campos.push('fecha_inicio = ?');
        params.push(fecha_inicio);
      }
      if (fecha_fin !== undefined) {
        campos.push('fecha_fin = ?');
        params.push(fecha_fin);
      }
      if (activa !== undefined) {
        campos.push('activa = ?');
        params.push(activa);
      }
      if (observaciones !== undefined) {
        campos.push('observaciones = ?');
        params.push(observaciones || null);
      }

      if (campos.length === 0) {
        return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
      }

      params.push(req.params.id);
      const [result] = await pool.query(
        `UPDATE membresias SET ${campos.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Membresía no encontrada' });
      }

      const [rows] = await pool.query(
        `SELECT m.id, m.afiliado_id, a.nombre AS afiliado, m.tipo_membresia_id,
                tm.nombre AS tipo_membresia, m.fecha_inicio, m.fecha_fin, m.activa, m.observaciones
         FROM membresias m
         JOIN afiliados a ON a.id = m.afiliado_id
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE m.id = ?`,
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
      const [pagos] = await pool.query(
        'SELECT COUNT(*) AS total FROM pagos WHERE membresia_id = ?',
        [req.params.id]
      );

      if (pagos[0].total > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar la membresía porque tiene pagos asociados',
        });
      }

      const [result] = await pool.query('DELETE FROM membresias WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Membresía no encontrada' });
      }

      res.json({ success: true, message: 'Membresía eliminada correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
