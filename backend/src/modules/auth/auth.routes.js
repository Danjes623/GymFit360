const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('../../config/db');
const validate = require('../../middlewares/validate');
const authenticateToken = require('../../middlewares/auth');
const upload = require('../../services/upload');
const { sendVerificationCode, sendPasswordResetEmail, sendContactEmail } = require('../../services/email');

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de registro. Intenta de nuevo en 15 minutos.' },
});

const codigoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Intenta de nuevo en 5 minutos.' },
});

function generarCodigo() {
  return crypto.randomInt(100000, 999999).toString();
}

async function limpiarExpirados() {
  try {
    const [result] = await pool.query(
      "DELETE FROM usuarios WHERE verificado = 0 AND codigo_expiracion IS NOT NULL AND codigo_expiracion < NOW()"
    );
    if (result.affectedRows > 0) {
      console.log(`[CLEANUP] ${result.affectedRows} registro(s) expirado(s) eliminado(s)`);
    }
  } catch (err) {
    console.error('[CLEANUP] Error:', err.message);
  }
}

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
        'SELECT id, nombre, email, password_hash, rol, admin_id, activo, verificado FROM usuarios WHERE email = ?',
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

      if (!usuario.verificado) {
        return res.status(403).json({
          success: false,
          error: 'Cuenta no verificada. Revisa tu email o solicita un nuevo código.',
          codigo: 'CUENTA_NO_VERIFICADA',
          email: usuario.email,
        });
      }

      // Auto-fix admin_id for admins that registered before the migration
      if (!usuario.admin_id && usuario.rol === 'admin') {
        await pool.query('UPDATE usuarios SET admin_id = id WHERE id = ?', [usuario.id]);
        usuario.admin_id = usuario.id;
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
    body('telefono')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, password, telefono } = req.body;

      await limpiarExpirados();

      const [existing] = await pool.query('SELECT id, verificado FROM usuarios WHERE email = ?', [email]);

      if (existing[0]) {
        if (existing[0].verificado) {
          return res.status(409).json({ success: false, error: 'El email ya está registrado' });
        }
        await pool.query('DELETE FROM usuarios WHERE id = ?', [existing[0].id]);
      }

      const hash = await bcrypt.hash(password, 10);
      const codigo = generarCodigo();
      const expiracion = new Date(Date.now() + 15 * 60 * 1000);

      const [afiliadoRows] = await pool.query(
        'SELECT admin_id FROM afiliados WHERE email = ? AND activo = 1 LIMIT 1',
        [email]
      );
      const adminId = afiliadoRows[0] ? afiliadoRows[0].admin_id : null;

      const [insertResult] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, telefono, rol, admin_id, verificado, codigo_verificacion, codigo_expiracion) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
        [nombre, email, hash, telefono || null, 'usuario', adminId, codigo, expiracion]
      );

      await pool.query(
        'UPDATE afiliados SET usuario_id = ? WHERE email = ? AND usuario_id IS NULL AND activo = 1',
        [insertResult.insertId, email]
      );

      await sendVerificationCode({ email, codigo, nombre });

      res.status(201).json({
        success: true,
        message: 'Código de verificación enviado a tu email',
        email,
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
  '/verificar-codigo',
  codigoLimiter,
  [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('codigo')
      .trim()
      .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, codigo } = req.body;

      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, admin_id, codigo_verificacion, codigo_expiracion, activo FROM usuarios WHERE email = ?',
        [email]
      );

      const usuario = rows[0];

      if (!usuario || !usuario.activo) {
        return res.status(400).json({ success: false, error: 'Cuenta no encontrada' });
      }

      if (usuario.verificado) {
        return res.status(400).json({ success: false, error: 'La cuenta ya está verificada' });
      }

      if (!usuario.codigo_verificacion || !usuario.codigo_expiracion) {
        return res.status(400).json({ success: false, error: 'No hay código pendiente. Solicita uno nuevo.' });
      }

      if (usuario.codigo_verificacion !== codigo) {
        return res.status(400).json({ success: false, error: 'Código incorrecto' });
      }

      if (new Date(usuario.codigo_expiracion) < new Date()) {
        return res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      await pool.query(
        'UPDATE usuarios SET verificado = 1, codigo_verificacion = NULL, codigo_expiracion = NULL, actualizado_en = NOW() WHERE id = ?',
        [usuario.id]
      );

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
  '/reenviar-codigo',
  codigoLimiter,
  [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const [rows] = await pool.query(
        'SELECT id, nombre, email, verificado, activo FROM usuarios WHERE email = ?',
        [email]
      );

      const usuario = rows[0];

      if (!usuario || !usuario.activo) {
        return res.status(400).json({ success: false, error: 'Cuenta no encontrada' });
      }

      if (usuario.verificado) {
        return res.status(400).json({ success: false, error: 'La cuenta ya está verificada' });
      }

      const codigo = generarCodigo();
      const expiracion = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        'UPDATE usuarios SET codigo_verificacion = ?, codigo_expiracion = ?, actualizado_en = NOW() WHERE id = ?',
        [codigo, expiracion, usuario.id]
      );

      await sendVerificationCode({ email, codigo, nombre: usuario.nombre });

      res.json({ success: true, message: 'Nuevo código enviado a tu email' });
    } catch (err) {
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
        'INSERT INTO usuarios (nombre, email, password_hash, rol, verificado) VALUES (?, ?, ?, ?, 1)',
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
      const adminId = req.user.admin_id || req.user.id;

      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol, admin_id, verificado) VALUES (?, ?, ?, ?, ?, 1)',
        [nombre, email, hash, 'recepcionista', adminId]
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

      const adminId = req.user.admin_id || req.user.id;
      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, admin_id, activo, creado_en FROM usuarios WHERE admin_id = ? ORDER BY creado_en DESC',
        [adminId]
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

    const effectiveAdminId = req.user.admin_id || req.user.id;

    const [configRows] = await pool.query(
      'SELECT nombre, logo, direccion, telefono FROM gimnasio_config WHERE admin_id = ?',
      [effectiveAdminId]
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
      const adminId = req.user.admin_id || req.user.id;

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
      const adminId = req.user.admin_id || req.user.id;

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

const contactLimiter = rateLimit({
  windowMs: 8 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: (req) => req.body?.email || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => {
    const resetTime = req.rateLimit?.resetTime;
    let restante = '8 horas';
    if (resetTime) {
      const diff = new Date(resetTime).getTime() - Date.now();
      const h = Math.floor(diff / 3600000);
      const m = Math.ceil((diff % 3600000) / 60000);
      restante = h > 0 ? `${h}h ${m}min` : `${m}min`;
    }
    return { success: false, error: `Ya enviaste un mensaje. Vuelve a intentarlo en ${restante}.` };
  },
});

router.post(
  '/contacto',
  contactLimiter,
  [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email').isEmail().withMessage('Debe ser un email válido').normalizeEmail(),
    body('mensaje').trim().isLength({ min: 10, max: 1000 }).withMessage('El mensaje debe tener entre 10 y 1000 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, mensaje } = req.body;

      const result = await sendContactEmail({ nombre, email, mensaje });

      if (!result.success) {
        return res.status(500).json({ success: false, error: 'Error al enviar el mensaje. Intenta de nuevo.' });
      }

      res.json({ success: true, message: 'Mensaje enviado correctamente. Te contactaremos pronto.' });
    } catch (err) {
      next(err);
    }
  }
);

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

router.post(
  '/olvide-password',
  resetLimiter,
  [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const [rows] = await pool.query(
        'SELECT id, nombre, activo FROM usuarios WHERE email = ?',
        [email]
      );

      // Always return success to avoid revealing if email exists
      if (!rows[0] || !rows[0].activo) {
        return res.json({ success: true, message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiracion = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query(
        'UPDATE usuarios SET reset_token = ?, reset_expiracion = ? WHERE id = ?',
        [token, expiracion, rows[0].id]
      );

      await sendPasswordResetEmail({ email, token, nombre: rows[0].nombre });

      res.json({ success: true, message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/restablecer-password',
  resetLimiter,
  [
    body('token')
      .trim()
      .notEmpty().withMessage('El token es requerido'),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('confirmarPassword')
      .isLength({ min: 6 }).withMessage('Debe confirmar la contraseña'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { token, password, confirmarPassword } = req.body;

      if (password !== confirmarPassword) {
        return res.status(422).json({ success: false, error: 'Las contraseñas no coinciden' });
      }

      const [rows] = await pool.query(
        'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expiracion > NOW() AND activo = 1',
        [token]
      );

      if (!rows[0]) {
        return res.status(400).json({ success: false, error: 'Token inválido o expirado' });
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        'UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_expiracion = NULL, actualizado_en = NOW() WHERE id = ?',
        [hash, rows[0].id]
      );

      res.json({ success: true, message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
