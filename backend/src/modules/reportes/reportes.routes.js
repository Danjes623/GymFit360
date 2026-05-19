const { Router } = require('express');
const pool = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

router.get('/resumen', async (req, res, next) => {
  try {
    const [[{ total: afiliados_activos }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM afiliados WHERE activo = 1"
    );
    const [[{ total: entrenadores_activos }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM entrenadores WHERE activo = 1"
    );
    const [[{ total: clases_hoy }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM clases WHERE activa = 1 AND DATE(horario) = CURDATE()"
    );
    const [[{ total: membresias_por_vencer }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM membresias WHERE activa = 1 AND fecha_fin BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY"
    );

    res.json({
      success: true,
      data: { afiliados_activos, entrenadores_activos, clases_hoy, membresias_por_vencer },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/ingresos', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(fecha_pago, '%Y-%m') AS mes, SUM(monto) AS total, COUNT(*) AS cantidad
       FROM pagos
       GROUP BY mes
       ORDER BY mes DESC
       LIMIT 12`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/distribucion-afiliados', async (req, res, next) => {
  try {
    const [membresias] = await pool.query(
      `SELECT tm.nombre, COUNT(m.id) AS total
       FROM tipos_membresia tm
       LEFT JOIN membresias m ON m.tipo_membresia_id = tm.id AND m.activa = 1
       GROUP BY tm.id, tm.nombre
       ORDER BY total DESC`
    );

    const [[{ total_afiliados }]] = await pool.query(
      "SELECT COUNT(*) AS total_afiliados FROM afiliados WHERE activo = 1"
    );

    res.json({ success: true, data: { membresias, total_afiliados } });
  } catch (err) {
    next(err);
  }
});

router.get('/ultimos-pagos', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, a.nombre AS afiliado, tm.nombre AS membresia
       FROM pagos p
       JOIN afiliados a ON a.id = p.afiliado_id
       JOIN membresias m ON m.id = p.membresia_id
       JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
       ORDER BY p.fecha_pago DESC
       LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
