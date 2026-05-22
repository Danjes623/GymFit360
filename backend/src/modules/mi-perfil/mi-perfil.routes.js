const { Router } = require('express');
const pool = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

function getAfiliadoQuery() {
  return 'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion FROM afiliados WHERE (usuario_id = ? OR email = ?) AND activo = 1 ORDER BY usuario_id DESC LIMIT 1';
}

router.get('/', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Solo los usuarios pueden acceder a esta sección' });
    }

    const [afiliados] = await pool.query(getAfiliadoQuery(), [req.user.id, req.user.email]);

    if (!afiliados[0]) {
      return res.status(404).json({ success: false, error: 'No tienes un perfil de afiliado vinculado. Contacta a administración.' });
    }

    const afiliado = afiliados[0];

    const [membresias] = await pool.query(
      `SELECT m.id, m.fecha_inicio, m.fecha_fin, m.activa, tm.nombre AS tipo_membresia, tm.precio
       FROM membresias m
       JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
       WHERE m.afiliado_id = ?
       ORDER BY m.fecha_inicio DESC
       LIMIT 1`,
      [afiliado.id]
    );

    res.json({
      success: true,
      data: {
        afiliado,
        membresia: membresias[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/clases', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    const [afiliados] = await pool.query(getAfiliadoQuery(), [req.user.id, req.user.email]);

    if (!afiliados[0]) {
      return res.status(404).json({ success: false, error: 'Perfil de afiliado no encontrado' });
    }

    const [rows] = await pool.query(
      `SELECT c.nombre, c.horario, c.duracion_minutos, e.nombre AS entrenador,
              ic.estado, ic.fecha_inscripcion
       FROM inscripciones_clases ic
       JOIN clases c ON c.id = ic.clase_id
       JOIN entrenadores e ON e.id = c.entrenador_id
       WHERE ic.afiliado_id = ?
       ORDER BY c.horario DESC`,
      [afiliados[0].id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/planes', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    const [afiliados] = await pool.query(getAfiliadoQuery(), [req.user.id, req.user.email]);

    if (!afiliados[0]) {
      return res.status(404).json({ success: false, error: 'Perfil de afiliado no encontrado' });
    }

    const [rows] = await pool.query(
      `SELECT pe.nombre, pe.descripcion, pe.objetivo, pe.fecha_inicio, pe.fecha_fin, pe.activo,
              e.nombre AS entrenador
       FROM planes_entrenamiento pe
       JOIN entrenadores e ON e.id = pe.entrenador_id
       WHERE pe.afiliado_id = ?
       ORDER BY pe.fecha_inicio DESC`,
      [afiliados[0].id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/pagos', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    const [afiliados] = await pool.query(getAfiliadoQuery(), [req.user.id, req.user.email]);

    if (!afiliados[0]) {
      return res.status(404).json({ success: false, error: 'Perfil de afiliado no encontrado' });
    }

    const [rows] = await pool.query(
      `SELECT p.monto, p.fecha_pago, p.metodo_pago, p.referencia, tm.nombre AS tipo_membresia
       FROM pagos p
       JOIN membresias m ON m.id = p.membresia_id
       JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
       WHERE p.afiliado_id = ?
       ORDER BY p.fecha_pago DESC`,
      [afiliados[0].id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
