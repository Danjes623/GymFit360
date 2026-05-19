const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, nombre: decoded.nombre, email: decoded.email, rol: decoded.rol };
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Token inválido o expirado' });
  }
};

module.exports = authenticateToken;
