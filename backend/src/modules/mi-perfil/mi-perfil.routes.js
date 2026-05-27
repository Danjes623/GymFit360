const { Router } = require('express');
const pool = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

async function findAfiliado(user) {
  const effectiveAdminId = user.admin_id || user.id;
  const query = 'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, admin_id FROM afiliados WHERE (usuario_id = ? OR email = ?) AND activo = 1 AND admin_id = ? ORDER BY usuario_id DESC LIMIT 1';
  const [afiliados] = await pool.query(query, [user.id, user.email, effectiveAdminId]);
  if (afiliados[0]) return afiliados[0];

  // Fallback: if user has no admin_id, try by email without admin_id filter
  if (!user.admin_id) {
    const fallbackQuery = 'SELECT id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, admin_id FROM afiliados WHERE (usuario_id = ? OR email = ?) AND activo = 1 ORDER BY usuario_id DESC LIMIT 1';
    const [fallback] = await pool.query(fallbackQuery, [user.id, user.email]);
    if (fallback[0]) {
      await pool.query('UPDATE usuarios SET admin_id = ? WHERE id = ?', [fallback[0].admin_id, user.id]);
      user.admin_id = fallback[0].admin_id;
      return fallback[0];
    }
  }

  return null;
}

router.get('/', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Solo los usuarios pueden acceder a esta sección' });
    }

    const usuario = {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
    };

    const afiliado = await findAfiliado(req.user);

    let membresia = null;
    let gimnasio = null;

    if (afiliado) {
      const [membresias] = await pool.query(
        `SELECT m.id, m.fecha_inicio, m.fecha_fin, m.activa, tm.nombre AS tipo_membresia, tm.precio
         FROM membresias m
         JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
         WHERE m.afiliado_id = ? AND m.admin_id = ?
         ORDER BY m.fecha_inicio DESC
         LIMIT 1`,
        [afiliado.id, afiliado.admin_id]
      );
      membresia = membresias[0] || null;

      const [configRows] = await pool.query(
        'SELECT nombre, logo, direccion, telefono FROM gimnasio_config WHERE admin_id = ?',
        [afiliado.admin_id]
      );
      gimnasio = configRows[0] || null;
    }

    res.json({
      success: true,
      data: { usuario, afiliado, membresia, gimnasio },
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

    const afiliado = await findAfiliado(req.user);

    if (!afiliado) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await pool.query(
      `SELECT c.nombre, c.horario, c.duracion_minutos, e.nombre AS entrenador,
              ic.estado, ic.fecha_inscripcion
       FROM inscripciones_clases ic
       JOIN clases c ON c.id = ic.clase_id
       JOIN entrenadores e ON e.id = c.entrenador_id
       WHERE ic.afiliado_id = ? AND ic.admin_id = ?
       ORDER BY c.horario DESC`,
      [afiliado.id, afiliado.admin_id]
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

    const afiliado = await findAfiliado(req.user);

    if (!afiliado) {
      return res.json({ success: true, data: [] });
    }

    const [planes] = await pool.query(
      `SELECT pe.id, pe.nombre, pe.descripcion, pe.objetivo, pe.fecha_inicio, pe.fecha_fin, pe.activo,
              e.nombre AS entrenador, e.id AS entrenador_id
       FROM planes_entrenamiento pe
       JOIN entrenadores e ON e.id = pe.entrenador_id
       WHERE pe.afiliado_id = ? AND pe.admin_id = ?
       ORDER BY pe.fecha_inicio DESC`,
      [afiliado.id, afiliado.admin_id]
    );

    const planesConEjercicios = await Promise.all(
      planes.map(async (plan) => {
        const [ejercicios] = await pool.query(
          `SELECT id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas
           FROM rutinas_ejercicio
           WHERE plan_id = ?
           ORDER BY dia_semana, orden`,
          [plan.id]
        );
        return { ...plan, ejercicios };
      })
    );

    res.json({ success: true, data: planesConEjercicios });
  } catch (err) {
    next(err);
  }
});

router.get('/calendario', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    const afiliado = await findAfiliado(req.user);

    if (!afiliado) {
      return res.json({ success: true, data: [] });
    }

    const [planes] = await pool.query(
      `SELECT pe.id, pe.nombre, pe.fecha_inicio, pe.fecha_fin, pe.activo,
              e.nombre AS entrenador
       FROM planes_entrenamiento pe
       JOIN entrenadores e ON e.id = pe.entrenador_id
       WHERE pe.afiliado_id = ? AND pe.admin_id = ? AND pe.activo = 1`,
      [afiliado.id, afiliado.admin_id]
    );

    const eventos = [];

    for (const plan of planes) {
      const [ejercicios] = await pool.query(
        `SELECT id, nombre, series, repeticiones, peso, dia_semana, hora, orden, notas
         FROM rutinas_ejercicio
         WHERE plan_id = ?
         ORDER BY dia_semana, orden`,
        [plan.id]
      );

      const inicio = new Date(plan.fecha_inicio);
      const fin = plan.fecha_fin ? new Date(plan.fecha_fin) : new Date(inicio.getTime() + 90 * 24 * 60 * 60 * 1000);

      for (const ej of ejercicios) {
        const diaSemana = ej.dia_semana;
        const current = new Date(inicio);

        while (current <= fin) {
          if (current.getDay() === (diaSemana % 7)) {
            const fechaStr = current.toISOString().split('T')[0];
            eventos.push({
              fecha: fechaStr,
              dia: DIAS[diaSemana],
              ejercicio: ej.nombre,
              series: ej.series,
              repeticiones: ej.repeticiones,
              peso: ej.peso,
              hora: ej.hora,
              plan: plan.nombre,
              entrenador: plan.entrenador,
            });
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }

    eventos.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '00:00').localeCompare(b.hora || '00:00'));

    res.json({ success: true, data: eventos });
  } catch (err) {
    next(err);
  }
});

router.get('/pagos', async (req, res, next) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
    }

    const afiliado = await findAfiliado(req.user);

    if (!afiliado) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await pool.query(
      `SELECT p.monto, p.fecha_pago, p.metodo_pago, p.referencia, tm.nombre AS tipo_membresia
       FROM pagos p
       JOIN membresias m ON m.id = p.membresia_id
       JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
       WHERE p.afiliado_id = ? AND p.admin_id = ?
       ORDER BY p.fecha_pago DESC`,
      [afiliado.id, afiliado.admin_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
