const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de registro. Intenta de nuevo en 15 minutos.' },
});

router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const [rows] = await pool.query(
        'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?',
        [email]
      );

      const usuario = rows[0];

      if (!usuario || !usuario.activo) {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }

      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValida) {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/register',
  registerLimiter,
  [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, password } = req.body;

      const hash = await bcrypt.hash(password, 10);

      const [insertResult] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, 'usuario']
      );

      await pool.query(
        'UPDATE afiliados SET usuario_id = ? WHERE email = ? AND usuario_id IS NULL AND activo = 1',
        [insertResult.insertId, email]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE email = ?',
        [email]
      );

      const usuario = rows[0];

      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
        },
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
      next(err);
    }
  }
);

router.post(
  '/register-admin',
  registerLimiter,
  [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('codigo')
      .trim()
      .notEmpty().withMessage('El código de invitación es requerido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, password, codigo } = req.body;

      const [codigos] = await pool.query(
        'SELECT id, usado FROM codigos_admin WHERE codigo = ?',
        [codigo]
      );

      const codigoValido = codigos[0];

      if (!codigoValido) {
        return res.status(400).json({ success: false, error: 'Código de invitación inválido' });
      }

      if (codigoValido.usado) {
        return res.status(400).json({ success: false, error: 'El código de invitación ya fue usado' });
      }

      const hash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, 'admin']
      );

      await pool.query(
        'UPDATE codigos_admin SET usado = 1, usado_por = ?, usado_en = NOW() WHERE id = ?',
        [result.insertId, codigoValido.id]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?',
        [result.insertId]
      );

      const usuario = rows[0];

      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
        },
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
      next(err);
    }
  }
);

router.post(
  '/invitar-recepcionista',
  authenticateToken,
  [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo los administradores pueden invitar recepcionistas' });
      }

      const { nombre, email, password } = req.body;
      const hash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, 'recepcionista']
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
      next(err);
    }
  }
);

router.get(
  '/usuarios',
  authenticateToken,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo los administradores pueden listar usuarios' });
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY creado_en DESC'
      );

      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
