const { Router } = require('express');
const { body, param, query } = require('express-validator');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  [
    query('estado')
      .optional()
      .isIn(['activa', 'por_vencer', 'vencida', 'todos'])
      .withMessage('Estado inválido: activa, por_vencer, vencida o todos'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { estado } = req.query;

      let sql = `
        SELECT a.id, a.nombre, a.email, a.telefono, a.documento, a.activo, a.usuario_id,
               tm.nombre AS tipo_membresia, m.fecha_fin, m.activa AS membresia_activa,
               CASE
                 WHEN m.id IS NULL THEN 'sin_membresia'
                 WHEN m.fecha_fin < CURDATE() THEN 'vencida'
                 WHEN m.fecha_fin <= CURDATE() + INTERVAL 7 DAY THEN 'por_vencer'
                 ELSE 'activa'
               END AS estado_membresia
        FROM afiliados a
        LEFT JOIN membresias m ON m.afiliado_id = a.id AND m.activa = 1
        LEFT JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
        WHERE a.admin_id = ?
      `;
      const params = [req.user.admin_id];

      if (estado && estado !== 'todos') {
        switch (estado) {
          case 'activa':
            sql += ' HAVING estado_membresia = ?';
            params.push('activa');
            break;
          case 'por_vencer':
            sql += ' HAVING estado_membresia = ?';
            params.push('por_vencer');
            break;
          case 'vencida':
            sql += ' HAVING estado_membresia = ?';
            params.push('vencida');
            break;
        }
      }

      sql += ' ORDER BY a.nombre';

      const [rows] = await pool.query(sql, params);
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
      const [afiliados] = await pool.query(
        'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, activo, usuario_id FROM afiliados WHERE id = ? AND admin_id = ?',
        [req.params.id, req.user.admin_id]
      );

      if (!afiliados[0]) {
        return res.status(404).json({ success: false, error: 'Afiliado no encontrado' });
      }

      const [membresias] = await pool.query(
        `SELECT m.id, m.fecha_inicio, m.fecha_fin, m.activa, m.observaciones,
                tm.nombre AS tipo_membresia, tm.duracion_dias, tm.precio
         FROM membresias m
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE m.afiliado_id = ?
         ORDER BY m.fecha_inicio DESC`,
        [req.params.id]
      );

      const [clases] = await pool.query(
        `SELECT c.id, c.nombre, c.horario, e.nombre AS entrenador
         FROM inscripciones_clases ic
         JOIN clases c ON c.id = ic.clase_id
         JOIN entrenadores e ON e.id = c.entrenador_id
         WHERE ic.afiliado_id = ? AND ic.estado = 'activa'
         ORDER BY c.horario`,
        [req.params.id]
      );

      res.json({
        success: true,
        data: { ...afiliados[0], membresias, clases },
      });
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
    body('documento')
      .trim()
      .notEmpty().withMessage('El documento es requerido')
      .isLength({ max: 30 }).withMessage('El documento no puede exceder 30 caracteres'),
    body('fecha_nacimiento')
      .optional({ values: 'falsy' })
      .isDate().withMessage('Fecha de nacimiento inválida'),
    body('direccion')
      .optional({ values: 'falsy' })
      .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, documento, fecha_nacimiento, direccion } = req.body;

      // If admin has no admin_id (pre-migration), use their own id
      const effectiveAdminId = req.user.admin_id || req.user.id;

      // Find user by email regardless of admin_id
      const [usuarios] = await pool.query(
        'SELECT id, admin_id FROM usuarios WHERE email = ? AND rol = ? AND activo = 1',
        [email, 'usuario']
      );
      const usuario = usuarios[0] || null;
      const usuario_id = usuario?.id || null;

      // If user found with mismatched admin_id, fix it
      if (usuario && usuario.admin_id !== effectiveAdminId) {
        await pool.query('UPDATE usuarios SET admin_id = ? WHERE id = ?', [effectiveAdminId, usuario.id]);
      }

      const [result] = await pool.query(
        `INSERT INTO afiliados (admin_id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        [effectiveAdminId, nombre, email, telefono || null, documento, fecha_nacimiento || null, direccion || null, usuario_id]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, activo, usuario_id FROM afiliados WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const field = err.sqlMessage.includes('email') ? 'email' : 'documento';
        return res.status(409).json({ success: false, error: `El ${field} ya está registrado` });
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
    body('documento')
      .trim()
      .notEmpty().withMessage('El documento es requerido')
      .isLength({ max: 30 }).withMessage('El documento no puede exceder 30 caracteres'),
    body('fecha_nacimiento')
      .optional({ values: 'falsy' })
      .isDate().withMessage('Fecha de nacimiento inválida'),
    body('direccion')
      .optional({ values: 'falsy' })
      .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, documento, fecha_nacimiento, direccion } = req.body;

      // If admin has no admin_id (pre-migration), use their own id
      const effectiveAdminId = req.user.admin_id || req.user.id;

      // Find user by email regardless of admin_id
      const [usuarios] = await pool.query(
        'SELECT id, admin_id FROM usuarios WHERE email = ? AND rol = ? AND activo = 1',
        [email, 'usuario']
      );
      const usuario = usuarios[0] || null;
      const usuario_id = usuario?.id || null;

      // If user found with mismatched admin_id, fix it
      if (usuario && usuario.admin_id !== effectiveAdminId) {
        await pool.query('UPDATE usuarios SET admin_id = ? WHERE id = ?', [effectiveAdminId, usuario.id]);
      }

      const [result] = await pool.query(
        `UPDATE afiliados
         SET nombre = ?, email = ?, telefono = ?, documento = ?,
             fecha_nacimiento = ?, direccion = ?, usuario_id = ?
         WHERE id = ? AND admin_id = ?`,
        [nombre, email, telefono || null, documento, fecha_nacimiento || null, direccion || null, usuario_id, req.params.id, effectiveAdminId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Afiliado no encontrado' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, activo, usuario_id FROM afiliados WHERE id = ? AND admin_id = ?',
        [req.params.id, req.user.admin_id]
      );

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const field = err.sqlMessage.includes('email') ? 'email' : 'documento';
        return res.status(409).json({ success: false, error: `El ${field} ya está registrado` });
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
           (SELECT COUNT(*) FROM membresias WHERE afiliado_id = ? AND activa = 1) AS membresias_activas,
           (SELECT COUNT(*) FROM inscripciones_clases WHERE afiliado_id = ? AND estado = 'activa') AS inscripciones_activas,
           (SELECT COUNT(*) FROM planes_entrenamiento WHERE afiliado_id = ? AND activo = 1) AS planes_activos`,
        [req.params.id, req.params.id, req.params.id]
      );

      const dep = dependencias[0];
      if (dep.membresias_activas > 0 || dep.inscripciones_activas > 0 || dep.planes_activos > 0) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar el afiliado porque tiene registros activos asociados',
          dependencias: dep,
        });
      }

      const [result] = await pool.query('DELETE FROM afiliados WHERE id = ? AND admin_id = ?', [req.params.id, req.user.admin_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Afiliado no encontrado' });
      }

      res.json({ success: true, message: 'Afiliado eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
