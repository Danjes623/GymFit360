const { Router } = require('express');
const pool = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

router.use(authenticateToken);

router.get('/resumen', async (req, res, next) => {
  try {
    const [[{ total: afiliados_activos }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM afiliados WHERE activo = 1 AND admin_id = ?",
      [req.user.admin_id]
    );
    const [[{ total: entrenadores_activos }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM entrenadores WHERE activo = 1 AND admin_id = ?",
      [req.user.admin_id]
    );
    const [[{ total: clases_hoy }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM clases WHERE activa = 1 AND DATE(horario) = CURDATE() AND admin_id = ?",
      [req.user.admin_id]
    );
    const [[{ total: membresias_por_vencer }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM membresias WHERE activa = 1 AND fecha_fin BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY AND admin_id = ?",
      [req.user.admin_id]
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
       WHERE admin_id = ?
       GROUP BY mes
       ORDER BY mes DESC
       LIMIT 12`,
      [req.user.admin_id]
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
       WHERE tm.admin_id = ?
       GROUP BY tm.id, tm.nombre
       ORDER BY total DESC`,
      [req.user.admin_id]
    );

    const [[{ total_afiliados }]] = await pool.query(
      "SELECT COUNT(*) AS total_afiliados FROM afiliados WHERE activo = 1 AND admin_id = ?",
      [req.user.admin_id]
    );

    res.json({ success: true, data: { membresias, total_afiliados } });
  } catch (err) {
    next(err);
  }
});

router.get('/metodos-pago', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT metodo_pago, COUNT(*) AS cantidad, SUM(monto) AS total
       FROM pagos
       WHERE admin_id = ? AND fecha_pago >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY metodo_pago
       ORDER BY total DESC`,
      [req.user.admin_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/resumen-financiero', async (req, res, next) => {
  try {
    const [[{ total_mes }]] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_mes
       FROM pagos
       WHERE admin_id = ? AND DATE_FORMAT(fecha_pago, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
      [req.user.admin_id]
    );

    const [[{ total_mes_anterior }]] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_mes_anterior
       FROM pagos
       WHERE admin_id = ? AND DATE_FORMAT(fecha_pago, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')`,
      [req.user.admin_id]
    );

    const [[{ total_anual }]] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_anual
       FROM pagos
       WHERE admin_id = ? AND YEAR(fecha_pago) = YEAR(NOW())`,
      [req.user.admin_id]
    );

    const [[{ promedio_mensual }]] = await pool.query(
      `SELECT COALESCE(ROUND(AVG(mensual.total), 0), 0) AS promedio_mensual
       FROM (
         SELECT SUM(monto) AS total
         FROM pagos
         WHERE admin_id = ? AND fecha_pago >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m')
       ) mensual`,
      [req.user.admin_id]
    );

    const variacion = total_mes_anterior > 0
      ? Math.round(((total_mes - total_mes_anterior) / total_mes_anterior) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        total_mes: Number(total_mes),
        total_mes_anterior: Number(total_mes_anterior),
        variacion,
        total_anual: Number(total_anual),
        promedio_mensual: Number(promedio_mensual),
      },
    });
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
       WHERE p.admin_id = ?
       ORDER BY p.fecha_pago DESC
       LIMIT 10`,
      [req.user.admin_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
