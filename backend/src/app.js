const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 4000;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(globalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'GymFit360 API funcionando' });
});

app.use('/api/auth/login', authLimiter);
app.use('/api', routes);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`GymFit360 API corriendo en puerto ${PORT}`);
});
