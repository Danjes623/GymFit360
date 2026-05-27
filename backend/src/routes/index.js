const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const afiliadosRoutes = require('../modules/afiliados/afiliados.routes');
const entrenadoresRoutes = require('../modules/entrenadores/entrenadores.routes');
const tiposMembresiaRoutes = require('../modules/tipos-membresia/tipos-membresia.routes');
const membresiasRoutes = require('../modules/membresias/membresias.routes');
const pagosRoutes = require('../modules/pagos/pagos.routes');
const clasesRoutes = require('../modules/clases/clases.routes');
const planesRoutes = require('../modules/planes/planes.routes');
const rutinasRoutes = require('../modules/rutinas/rutinas.routes');
const reportesRoutes = require('../modules/reportes/reportes.routes');
const miPerfilRoutes = require('../modules/mi-perfil/mi-perfil.routes');
const planesAdminRoutes = require('../modules/planes-admin/planes-admin.routes');
const suscripcionesAdminRoutes = require('../modules/suscripciones-admin/suscripciones-admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/afiliados', afiliadosRoutes);
router.use('/entrenadores', entrenadoresRoutes);
router.use('/tipos-membresia', tiposMembresiaRoutes);
router.use('/membresias', membresiasRoutes);
router.use('/pagos', pagosRoutes);
router.use('/clases', clasesRoutes);
router.use('/planes', planesRoutes);
router.use('/rutinas', rutinasRoutes);
router.use('/reportes', reportesRoutes);
router.use('/mi-perfil', miPerfilRoutes);
router.use('/planes-admin', planesAdminRoutes);
router.use('/suscripciones-admin', suscripcionesAdminRoutes);

module.exports = router;
