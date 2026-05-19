const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const afiliadosRoutes = require('../modules/afiliados/afiliados.routes');
const entrenadoresRoutes = require('../modules/entrenadores/entrenadores.routes');
const tiposMembresiaRoutes = require('../modules/tipos-membresia/tipos-membresia.routes');
const membresiasRoutes = require('../modules/membresias/membresias.routes');
const clasesRoutes = require('../modules/clases/clases.routes');
const planesRoutes = require('../modules/planes/planes.routes');
const reportesRoutes = require('../modules/reportes/reportes.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/afiliados', afiliadosRoutes);
router.use('/entrenadores', entrenadoresRoutes);
router.use('/tipos-membresia', tiposMembresiaRoutes);
router.use('/membresias', membresiasRoutes);
router.use('/clases', clasesRoutes);
router.use('/planes', planesRoutes);
router.use('/reportes', reportesRoutes);

module.exports = router;
