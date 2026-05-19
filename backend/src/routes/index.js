const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const afiliadosRoutes = require('../modules/afiliados/afiliados.routes');
const entrenadoresRoutes = require('../modules/entrenadores/entrenadores.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/afiliados', afiliadosRoutes);
router.use('/entrenadores', entrenadoresRoutes);

module.exports = router;
