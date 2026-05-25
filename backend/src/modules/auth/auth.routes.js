const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');
const upload = require('../../services/upload');

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
        'SELECT id, nombre, email, password_hash, rol, admin_id, activo FROM usuarios WHERE email = ?',
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
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, admin_id: usuario.admin_id },
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
            admin_id: usuario.admin_id,
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

      const [afiliadoRows] = await pool.query(
        'SELECT admin_id FROM afiliados WHERE email = ? AND activo = 1 LIMIT 1',
        [email]
      );
      const adminId = afiliadoRows[0] ? afiliadoRows[0].admin_id : null;

      const [insertResult] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol, admin_id) VALUES (?, ?, ?, ?, ?)',
        [nombre, email, hash, 'usuario', adminId]
      );

      await pool.query(
        'UPDATE afiliados SET usuario_id = ? WHERE email = ? AND usuario_id IS NULL AND activo = 1',
        [insertResult.insertId, email]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, admin_id, activo, creado_en FROM usuarios WHERE email = ?',
        [email]
      );

      const usuario = rows[0];

      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, admin_id: usuario.admin_id },
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
            admin_id: usuario.admin_id,
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

      const [codigosViejos] = await pool.query(
        'SELECT id, usado FROM codigos_admin WHERE codigo = ?',
        [codigo]
      );

      const [suscripcionesNuevas] = await pool.query(
        'SELECT id, codigo_usado AS usado FROM suscripciones_admin WHERE codigo = ? AND pagado = 1',
        [codigo]
      );

      const codigoValido = codigosViejos[0] || suscripcionesNuevas[0];
      const esSuscripcion = !!suscripcionesNuevas[0];

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
        'UPDATE usuarios SET admin_id = id WHERE id = ?',
        [result.insertId]
      );

      if (esSuscripcion) {
        await pool.query(
          'UPDATE suscripciones_admin SET codigo_usado = 1, usado_por = ?, usado_en = NOW() WHERE id = ?',
          [result.insertId, codigoValido.id]
        );
      } else {
        await pool.query(
          'UPDATE codigos_admin SET usado = 1, usado_por = ?, usado_en = NOW() WHERE id = ?',
          [result.insertId, codigoValido.id]
        );
      }

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, admin_id, activo, creado_en FROM usuarios WHERE id = ?',
        [result.insertId]
      );

      const usuario = rows[0];

      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, admin_id: usuario.admin_id },
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
            admin_id: usuario.admin_id,
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
        'INSERT INTO usuarios (nombre, email, password_hash, rol, admin_id) VALUES (?, ?, ?, ?, ?)',
        [nombre, email, hash, 'recepcionista', req.user.admin_id]
      );

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, admin_id, activo, creado_en FROM usuarios WHERE id = ?',
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
        'SELECT id, nombre, email, rol, admin_id, activo, creado_en FROM usuarios WHERE admin_id = ? ORDER BY creado_en DESC',
        [req.user.admin_id]
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

    const [configRows] = await pool.query(
      'SELECT nombre, logo, direccion, telefono FROM gimnasio_config WHERE admin_id = ?',
      [req.user.admin_id]
    );

    const gimnasio = configRows[0]
      ? configRows[0]
      : {
          nombre: process.env.GYM_NOMBRE || 'GymFit360',
          logo: process.env.GYM_LOGO || '/logo.png',
          direccion: process.env.GYM_DIRECCION || '',
          telefono: process.env.GYM_TELEFONO || '',
        };

    res.json({ success: true, data: { ...rows[0], gimnasio } });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/gimnasio',
  authenticateToken,
  [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('direccion')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
    body('telefono')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo los administradores pueden modificar la configuración del gimnasio' });
      }

      const { nombre, direccion, telefono } = req.body;
      const adminId = req.user.admin_id;

      await pool.query(
        `INSERT INTO gimnasio_config (admin_id, nombre, direccion, telefono)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), direccion = VALUES(direccion), telefono = VALUES(telefono), actualizado_en = NOW()`,
        [adminId, nombre, direccion || '', telefono || '']
      );

      const [configRows] = await pool.query(
        'SELECT nombre, logo, direccion, telefono FROM gimnasio_config WHERE admin_id = ?',
        [adminId]
      );

      res.json({ success: true, data: configRows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/gimnasio/logo',
  authenticateToken,
  upload.single('logo'),
  async (req, res, next) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo los administradores pueden modificar el logo' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Debes seleccionar una imagen' });
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      const adminId = req.user.admin_id;

      await pool.query(
        `INSERT INTO gimnasio_config (admin_id, logo)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE logo = VALUES(logo), actualizado_en = NOW()`,
        [adminId, logoUrl]
      );

      res.json({ success: true, data: { logo: logoUrl } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
