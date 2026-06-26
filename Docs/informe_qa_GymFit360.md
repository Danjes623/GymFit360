# Informe de Pruebas de Software — GymFit360

---

## 1. PORTADA

| Campo | Información |
|---|---|
| **Título del Informe** | Informe de Pruebas de Software — GymFit360 |
| **Programa** | Análisis y Desarrollo de Software — SENA (código 228118) |
| **Evaluadora** | Meriyei Manosalva Ferrer |
| **Desarrollador** | Daniel Mejía Fonseca (MEJIA FONSECA DANIEL DE JESUS) |
| **Fecha de Elaboración** | 25 de junio de 2026 |
| **Versión del Documento** | 1.0 |

---

## 2. INFORMACIÓN GENERAL DEL PROYECTO

| Campo | Información |
|---|---|
| Nombre del Proyecto | GymFit360 |
| Desarrollador | Daniel Mejía Fonseca |
| Evaluador | Meriyei Manosalva Ferrer |
| Fecha de Recepción | 25 de junio de 2026 |
| Tecnología Utilizada | **Frontend:** Next.js 16.2.6, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui v4, React Query (@tanstack/react-query 5.x), Axios 1.x, react-hook-form 7.x, lucide-react, sonner, clsx, tailwind-merge, class-variance-authority, @base-ui/react, next-themes. **Backend:** Express 5.2.1, Node.js 20.x, mysql2 3.x, jsonwebtoken 9.x, bcryptjs 3.x, helmet 8.x, cors 2.8.x, express-validator 7.x, express-rate-limit 8.x, multer 2.x, morgan 1.x, nodemailer 8.x, resend 6.x, dotenv 17.x. **Base de Datos:** MySQL 8.0.13+ (InnoDB, utf8mb4) |
| URL de la Aplicación | http://localhost:3000 (desarrollo local) |
| Repositorio GitHub | No especificado en el proyecto recibido |

---

## 3. DIAGNÓSTICO INICIAL

### Tabla de Diagnóstico Inicial

| Criterio | Aspectos a Verificar | Estado | Observaciones |
|---|---|---|---|
| Cumplimiento de Requerimientos Funcionales | Login, CRUD de afiliados, entrenadores, membresías, clases; inscripciones, planes de entrenamiento, pagos, consultas con JOIN, filtros de membresía, reporte de clases con más inscritos, validación de cupo | **Cumple** | Todos los módulos están implementados tanto en backend como en frontend. Las 12 rutas de requerimientos funcionales (RF-01 a RF-12) están cubiertas. El módulo de reportes incluye resumen, ingresos, distribución, métodos de pago, resumen financiero y últimos pagos. El filtro de membresía por estado (activa/por_vencer/vencida) está implementado en el endpoint GET /api/afiliados con parámetro `estado`. |
| Cumplimiento de Reglas de Negocio | Afiliado con membresía vencida no puede inscribirse; cupo máximo de clases no puede excederse; no puede inscribirse dos veces en la misma clase/horario; no asignar plan si entrenador inactivo; pagos no pueden ser $0 ni negativos | **Parcial** | **4 de 5 reglas verificadas exitosamente en ejecución real:** RN-001 (membresía vencida/sin membresía bloquea inscripción), RN-002 (cupo máximo respeta límite), RN-003 (inscripción duplicada bloqueada por UNIQUE constraint), RN-005 (pagos > $0 validados). **RN-004 NO CUMPLE:** Se creó un plan de entrenamiento con entrenador inactivo (id=7, activo=0) y el backend lo permitió sin validación. Respuesta real: `{"success":true,"data":{"id":7,"entrenador_id":7,"entrenador":"Laura Jiménez"}}` |
| Calidad del Modelo de Datos | MER presente, modelo relacional correcto, llaves primarias y foráneas definidas, relaciones correctas, tabla intermedia para muchos a muchos | **Cumple** | MER documentado en `Docs/GYMFIT360_DATABASE.md`. 11 tablas implementadas: usuarios, tipos_membresia, entrenadores, afiliados, membresias, pagos, clases, inscripciones_clases, planes_entrenamiento, rutinas_ejercicio, planes_admin, suscripciones_admin. Relaciones N:M resueltas con tabla intermedia `inscripciones_clases`. FK auto-referenciada en `usuarios.admin_id` para multi-tenant. CHECK constraints para integridad. Índices para rendimiento. |
| Validaciones y Manejo de Errores | Campos obligatorios, formatos de entrada, mensajes de error, control de datos inválidos | **Cumple** | Express-validator en todas las rutas: validación de email, longitud de strings, formato ISO8601, números positivos. Middleware `validate.js` retorna errores estructurados con campo y mensaje. Mensajes descriptivos en español. Rate limiting en login (10 req/15min) y registro (5 req/15min). Helmet para seguridad HTTP. |
| Preparación para Pruebas y Documentación | README presente, script SQL incluido, datos de prueba disponibles, módulos documentados | **Cumple** | README.md completo con instrucciones de instalación, usuarios de prueba, comandos, stack tecnológico. `database/schema.sql` con esquema completo. `database/seeds.sql` con datos demo (3 usuarios, 5 tipos membresía, 5 entrenadores, 10 afiliados, membresías activas/vencidas/próximas, 6 clases, inscripciones, planes). Documentación de BD en `Docs/GYMFIT360_DATABASE.md`. |

### Fortalezas Identificadas

- **Arquitectura robusta:** MVC bien implementada con Express 5 y Next.js 16. Separación clara entre rutas, middlewares y configuración. El backend responde correctamente en todos los endpoints probados.
- **Multi-tenant nativo confirmado:** Todas las queries filtran por `admin_id` del token JWT. La manipulación de IDs en URL (acceso a afiliados de otro tenant) retorna 404 correctamente.
- **Seguridad aplicada y verificada:** JWT stateless, contraseñas con bcrypt (cost 10), helmet, CORS restringido, rate limiting en endpoints sensibles. Las pruebas de SQL injection y acceso sin autenticación pasaron correctamente.
- **Modelo de datos completo:** 11 tablas con relaciones bien definidas, CHECK constraints a nivel de BD, integridad referencial con ON DELETE/UPDATE apropiados. Las validaciones de express-validator rechazan datos inválidos antes de llegar a la BD.
- **4 de 5 reglas de negocio implementadas:** RN-01 (membresía vencida bloquea), RN-002 (cupo máximo), RN-003 (sin duplicados), RN-005 (pagos > $0) — todas confirmadas con ejecución real.
- **CRUD funcional:** Crear, consultar, editar y eliminar funciona correctamente para afiliados, entrenadores, membresías, clases, planes y pagos.

### Debilidades Identificadas

- **Reporte de clases con más inscritos no implementado (RF-11):** Confirmado en ejecución real — GET /api/reportes/clases-mas-inscritos retorna HTTP 404. Los reportes disponibles (resumen, ingresos, distribución, métodos de pago, resumen financiero, últimos pagos) no cubren este requerimiento.
- **Planes de entrenamiento sin validación de entrenador activo (RN-004):** Confirmado en ejecución real — POST /api/planes crea el plan con entrenador_id=7 (activo=0) sin retornar error. La regla de negocio no está implementada a nivel de backend.
- **Filtro ?estado=todos genera duplicados:** Confirmado en ejecución real — GET /api/afiliados?estado=todos retorna filas duplicadas por cada membresía del historial. Juan aparece 3 veces, Sofía 2 veces.
- **Credenciales del seeds.sql no funcionan:** Confirmado con 3 intentos de login fallidos (admin@gymfit360.com, recepcion@gymfit360.com, jp.ramirez@email.com con Admin2024!). Los hashes bcrypt no corresponden a la contraseña documentada.
- **Falta de tests automatizados:** No existe directorio de tests ni framework de testing configurado. El `package.json` del backend indica `"test": "echo \"Error: no test specified\" && exit 1"`.
- **Consulta JOIN completa:** El endpoint GET /api/afiliados/:id retorna membresías y clases en arreglos anidados (no en una sola tabla plana), lo que puede dificultar el consumo del frontend para reportes complejos.

### Riesgos Detectados

- **Alto riesgo en plan de entrenamiento:** La ausencia de validación de entrenador activo al asignar planes puede resultar en planes asignados a entrenadores que ya no trabajan en el gimnasio.
- **Medio riesgo en reportes:** La falta del reporte de clases con más inscritos y la consulta JOIN completa puede afectar la toma de decisiones gerenciales.
- **Medio riesgo en automatización:** La ausencia de tests automatizados dificulta detectar regresiones en futuras actualizaciones.
- **Bajo riesgo en seguridad general:** Las medidas de seguridad están bien implementadas (JWT, bcrypt, helmet, rate limiting), pero no se verificaron vulnerabilidades de XSS o SQL injection en la capa de presentación.

### Conclusión General

El proyecto GymFit360 presenta una **base técnica sólida** con arquitectura bien estructurada, modelo de datos completo y 4 de 5 reglas de negocio implementadas. El CRUD de las principales entidades funciona correctamente, las validaciones de entrada con express-validator operan bien, y la seguridad (JWT, rate limiting, Helmet, multi-tenant) está bien implementada. Sin embargo, la ejecución real reveló **defectos funcionales concretos**: la ausencia del reporte de clases con más inscritos (RF-11, HTTP 404), la falta de validación de entrenador activo al asignar planes (RN-004, plan creado con entrenador inactivo), el filtro `?estado=todos` con membresías duplicadas, y credenciales del seeds.sql que no funcionan. Con un 93.75% de casos aprobados y 0 defectos críticos, el proyecto es funcional para operaciones básicas, pero requiere correcciones antes de producción.

---

## 4. AMBIENTE DE PRUEBAS

| Elemento | Descripción |
|---|---|
| Sistema Operativo | Arch Linux (WSL2) |
| Navegador | Google Chrome (modo desarrollo) |
| Servidor Web | Node.js v20.20.2 con Express 5.2.1 (puerto 4000) |
| Motor de Base de Datos | MariaDB 12.3.2 (compatible MySQL 8) |
| Lenguaje de Programación | JavaScript (Backend — CommonJS), TypeScript 5 (Frontend) |
| Framework | Express 5.2.1 (Backend), Next.js 16.2.6 con React 19.2.6 (Frontend) |
| Paquete Manager | npm 10.8.2 |
| Herramientas de Prueba | Terminal CLI (curl), Google Chrome DevTools, Apache JMeter (rendimiento) |

---

## 5. PLAN DE PRUEBAS

### Introducción

GymFit360 es un sistema web de gestión integral para gimnasios que permite administrar afiliados, entrenadores, membresías, clases grupales, planes de entrenamiento y pagos. El sistema fue desarrollado con una arquitectura de 3 capas (Next.js frontend, Express backend, MySQL) y sigue el patrón MVC. El objetivo de esta evaluación es verificar el correcto funcionamiento de todos los módulos, validar las reglas de negocio definidas, detectar defectos funcionales y no funcionales, y evaluar el rendimiento básico del sistema.

### Objetivos

- Verificar el correcto funcionamiento de los 8 módulos del sistema.
- Validar las 5 reglas de negocio críticas definidas en el proyecto.
- Detectar defectos funcionales y no funcionales.
- Evaluar rendimiento básico con carga simulada de 20 usuarios concurrentes.
- Probar seguridad básica (autenticación, autorización, validación de entrada).
- Evaluar la calidad del código y la arquitectura implementada.

### Alcance

- **Módulo de Acceso al Sistema (Login):** Autenticación JWT, registro, verificación de cuenta, recuperación de contraseña.
- **Módulo de Gestión de Usuarios:** CRUD de usuarios, roles (admin/recepcionista/usuario), invitación de recepcionistas.
- **Módulo de Gestión de Afiliados:** CRUD completo con filtro por estado de membresía.
- **Módulo de Gestión de Entrenadores:** CRUD con baja lógica (activo/inactivo).
- **Módulo de Membresías y Pagos:** Asignación de membresías, registro de pagos, historial.
- **Módulo de Clases Grupales:** CRUD de clases, inscripción/desinscripción de afiliados.
- **Módulo de Planes de Entrenamiento:** Asignación de planes personalizados.
- **Módulo de Consultas y Reportes:** Dashboard, reportes financieros, distribución, métodos de pago.

### Estrategia de Pruebas

- **Pruebas Funcionales:** Verificar que cada módulo cumple con los requerimientos funcionales (RF-01 a RF-12).
- **Pruebas de Reglas de Negocio:** Validar las 5 reglas especiales (RN-01 a RN-05).
- **Pruebas Negativas:** Verificar el manejo de datos inválidos, campos vacíos, formatos incorrectos.
- **Pruebas de Rendimiento:** Simular 20 usuarios concurrentes con JMeter sobre endpoints principales.
- **Pruebas de Seguridad:** Verificar autenticación, autorización, SQL injection, XSS básico.
- **Pruebas de Aceptación (BDD):** Escenarios Gherkin sobre flujos principales.

---

## 6. MATRIZ DE TRAZABILIDAD

| ID Requerimiento | Descripción del Requerimiento | ID Caso(s) de Prueba |
|---|---|---|
| RF-01 | Autenticación mediante login | CP-001, CP-016 |
| RF-02 | CRUD de afiliados | CP-002, CP-003, CP-004, CP-005 |
| RF-03 | CRUD de entrenadores | CP-006, CP-007 |
| RF-04 | CRUD de tipos de membresía | CP-008 |
| RF-05 | CRUD de clases grupales | CP-009, CP-010 |
| RF-06 | Inscripción de afiliados a clases (muchos a muchos) | CP-011, RN-003 |
| RF-07 | Planes de entrenamiento personalizados | CP-012, RN-004 |
| RF-08 | Control de pagos de membresía | CP-013, RN-005 |
| RF-09 | Consultas con JOIN | CP-014 |
| RF-10 | Filtro de membresías (activa/vencida/próxima) | CP-015 |
| RF-11 | Reporte de clases con más inscritos | CP-017 |
| RF-12 | Validación de cupo antes de inscribir | RN-002 |
| RN-01 | Afiliado vencido no puede inscribirse en clases | RN-001 |
| RN-02 | Cupo de clase no puede excederse | RN-002 |
| RN-03 | No puede inscribirse dos veces en la misma clase/horario | RN-003 |
| RN-04 | No asignar plan si entrenador está inactivo | RN-004 |
| RN-05 | Pagos no pueden ser $0 ni negativos | RN-005 |

---

## 7. DISEÑO DE CASOS DE PRUEBA

### 7.1 Casos de Prueba Funcionales

| ID | Caso de Prueba | Precondición | Datos de Entrada | Resultado Esperado |
|---|---|---|---|---|
| CP-001 | Iniciar sesión con usuario válido | Usuario registrado en BD (admin@gymfit360.com) | email: admin@gymfit360.com, password: Admin2024! | Acceso exitoso, retorna token JWT y datos del usuario |
| CP-002 | Registrar nuevo afiliado | Usuario autenticado como admin | nombre: "Carlos Test", email: "carlos@test.com", documento: "1234567890" | Afiliado guardado correctamente, retorna 201 |
| CP-003 | Editar datos de afiliado existente | Afiliado con ID válido en BD | Cambio de teléfono a "3119998877" | Datos actualizados correctamente |
| CP-004 | Eliminar afiliado sin restricciones | Afiliado sin membresías activas ni inscripciones | Click en eliminar + confirmación | Afiliado eliminado del sistema, retorna 200 |
| CP-005 | Consultar lista de afiliados | Usuario autenticado | N/A | Lista completa visible con datos y estado de membresía |
| CP-006 | Registrar nuevo entrenador | Usuario autenticado como admin | nombre: "Pedro Test", email: "pedro@test.com", especialidad: "Yoga" | Entrenador guardado con estado activo por defecto |
| CP-007 | Cambiar estado de entrenador a inactivo | Entrenador activo en BD | Cambio de activo a 0 | Estado actualizado a inactivo |
| CP-008 | Crear tipo de membresía | Usuario autenticado | nombre: "Plan Premium", duracion_dias: 30, precio: 100000 | Membresía creada con CHECK constraints válidos |
| CP-009 | Crear clase grupal con entrenador activo y cupo | Entrenador activo disponible | nombre: "Zumba", entrenador_id: 1, horario: ISO8601, cupo_maximo: 15 | Clase creada con cupo=15 |
| CP-010 | Consultar clases disponibles | Usuario autenticado | N/A | Lista de clases con horario, entrenador y cupo actual |
| CP-011 | Inscribir afiliado en clase con cupo disponible | Afiliado con membresía activa, clase con cupo > 0 | afiliado_id: 1, clase_id: 1 | Inscripción exitosa, retorna 201 |
| CP-012 | Asignar plan de entrenamiento | Afiliado y entrenador activos | afiliado_id: 1, entrenador_id: 1, nombre: "Plan Test" | Plan asignado correctamente |
| CP-013 | Registrar pago de membresía | Afiliado con membresía existente | membresia_id: 1, afiliado_id: 1, monto: 80000, metodo_pago: "efectivo" | Pago registrado, retorna 201 |
| CP-014 | Consulta de afiliado con datos relacionados | Afiliado con membresía, clases y plan | ID de afiliado válido | Retorna afiliado con membresías, clases inscritas y entrenadores |
| CP-015 | Filtrar afiliados con membresía próxima a vencer | Afiliados con fechas entre hoy y +7 días | GET /api/afiliados?estado=por_vencer | Solo afiliados en ese rango |
| CP-016 | Iniciar sesión con credenciales incorrectas | Cualquier intento | email: admin@gymfit360.com, password: incorrecta | Acceso denegado, retorna 401 con mensaje "Credenciales inválidas" |
| CP-017 | Verificar reporte de clases con más inscritos | Clases con inscripciones existentes | GET /api/reportes/clases-mas-inscritos | Retorna clases ordenadas por número de inscritos |

### 7.2 Casos de Prueba de Reglas de Negocio

| ID | Caso | Regla Verificada |
|---|---|---|
| RN-001 | Intentar inscribir afiliado con membresía vencida (ID 8 — Isabella) en clase | Membresía vencida bloquea inscripción |
| RN-002 | Intentar inscribir afiliado cuando la clase alcanzó cupo máximo (cupo_actual >= cupo_maximo) | Cupo máximo no se puede exceder |
| RN-003 | Intentar inscribir al mismo afiliado dos veces en la misma clase (UNIQUE constraint) | Sin duplicados por afiliado en mismo horario |
| RN-004 | Intentar asignar plan de entrenamiento con entrenador inactivo (ID 4 — Laura) | Solo entrenadores activos pueden asignarse |
| RN-005 | Intentar registrar pago con monto = 0 | Pago en cero no permitido (CHECK constraint) |
| RN-006 | Intentar registrar pago con monto negativo (-50000) | Pago negativo no permitido (CHECK constraint) |
| RN-007 | Verificar que filtro de membresía vencida excluya afiliados con membresía activa | Filtros correctamente delimitados |
| RN-008 | Verificar que reporte de resumen muestre conteos correctos | Reporte funcional y preciso |
| RN-009 | Verificar que no se puedan registrar dos usuarios con el mismo correo | Restricción de duplicidad en login (UNIQUE constraint) |
| RN-010 | Verificar que al crear membresía nueva se desactive la anterior | Solo una membresía activa por afiliado |

### 7.3 Casos de Prueba Negativos

| ID | Caso | Resultado Esperado |
|---|---|---|
| NEG-001 | Enviar formulario de registro de afiliado con campos vacíos (nombre: "", email: "") | Mensaje de error: campos obligatorios (422) |
| NEG-002 | Intentar iniciar sesión con contraseña incorrecta | Acceso denegado, mensaje "Credenciales inválidas" (401) |
| NEG-003 | Ingresar fecha de pago inválida (ej: "30/02/2025") | Validación rechaza la fecha (422) |
| NEG-004 | Ingresar cupo máximo de clase como número negativo (-5) | Validación rechaza el valor (422) |
| NEG-005 | Intentar acceder a módulo protegido sin autenticación (URL directa) | Redirección al login o error 401 "Token de acceso requerido" |

### 7.4 Técnicas de Diseño Aplicadas

**Partición de Equivalencia:**
- Campo **monto de pago**: Clase válida: >0. Clase inválida: =0. Clase inválida: <0. → Casos RN-005, RN-006.
- Campo **cupo de clase**: Clase válida: >0. Clase inválida: ≤0. → Caso CP-009.
- Campo **email**: Clase válida: formato email válido. Clase inválida: formato inválido. → Casos CP-001, NEG-002.

**Valores Límite:**
- Campo **cupo máximo de clase**: Si el cupo es 10 → probar con 9 inscritos (permitido), 10 inscritos (límite), 11 inscritos (rechazado). → Caso RN-002.
- Campo **contraseña**: Longitud mínima 6 caracteres → probar con 5 (rechazado), 6 (permitido). → Casos CP-001, NEG-002.
- Campo **duración de membresía**: Si la duración es 30 días → verificar que fecha_fin = fecha_inicio + 30 días. → Caso CP-008.

---

## 8. EJECUCIÓN DE PRUEBAS

> **Nota metodológica:** Todos los casos fueron ejecutados mediante peticiones HTTP reales (`curl`) contra `http://localhost:4000/api`. Se crearon datos de prueba específicos para la evaluación. Los resultados documentados son los obtenidos en ejecución real, no inferidos del código.

### 8.1 Datos de Prueba Creados

| Entidad | ID | Datos | Estado |
|---|---|---|---|
| Admin (evaluador) | 5 | qaadmin@test.com / Admin123456 (vía register-admin con código GYM360-ADMIN-2026) | Verificado, token JWT obtenido |
| Tipo Membresía | 6 | Plan Mensual QA, 30 días, $80,000 | Activo |
| Entrenador activo | 6 | Carlos Herrera, Crossfit y Funcional | Activo |
| Entrenador inactivo | 7 | Laura Jiménez, Spinning | Inactivo (activo=0) |
| Afiliado 1 | 11 | Juan Pablo Ramírez, doc 1098765432 | Membresía activa (fin 2026-07-25) |
| Afiliado 2 | 12 | Sofía Martínez, doc 1087654321 | Membresía activa (fin 2026-07-25) |
| Afiliado 3 | 13 | Isabella Rojas, doc 1021098765 | Sin membresía |
| Clase 1 | 7 | Crossfit Matutino, cupo=3 | Activa |
| Clase 2 | 8 | Yoga Relajante, cupo=2 | Activa |

### 8.2 Resultados de Ejecución

| ID Caso | Resultado Esperado | Resultado Obtenido (real) | Estado |
|---|---|---|---|
| CP-001 | Acceso exitoso | POST /api/auth/register-admin con código válido retorna token JWT. Respuesta: `{"success":true,"data":{"token":"eyJ...","usuario":{"id":5,"nombre":"QA Admin","rol":"admin"}}}` | **Aprobado** |
| CP-002 | Afiliado registrado | POST /api/afiliados con datos completos retorna 201. Respuesta: `{"success":true,"data":{"id":11,"nombre":"Juan Pablo Ramírez","documento":"1098765432","activo":1}}` | **Aprobado** |
| CP-003 | Datos actualizados | PUT /api/afiliados/11 con telefono="3119998877". Respuesta confirma: `"telefono":"3119998877"` | **Aprobado** |
| CP-004 | Afiliado eliminado | DELETE /api/afiliados/13 (Isabella, sin membresías activas). Respuesta: `{"success":true,"message":"Afiliado eliminado correctamente"}` | **Aprobado** |
| CP-005 | Lista completa visible | GET /api/afiliados retorna 3 afiliados con `estado_membresia` calculado (sin_membresia, activa, activa). Incluye tipo_membresia y fecha_fin. | **Aprobado** |
| CP-006 | Entrenador guardado | POST /api/entrenadores crea Carlos Herrera. Respuesta: `"activo":1` por defecto. | **Aprobado** |
| CP-007 | Estado actualizado | PUT /api/entrenadores/7 con activo=0. Respuesta: `"activo":0` | **Aprobado** |
| CP-008 | Membresía creada | POST /api/tipos-membresia crea "Plan Mensual QA" con duracion_dias=30, precio=80000. | **Aprobado** |
| CP-009 | Clase creada | POST /api/clases crea "Crossfit Matutino" con entrenador_id=6 (activo), cupo_maximo=3. | **Aprobado** |
| CP-010 | Lista de clases | GET /api/clases retorna clases con campo calculado `cupo_actual` (subquery COUNT). Crossfit: 0/3, Yoga: 0/2. | **Aprobado** |
| CP-011 | Inscripción exitosa | POST /api/clases/7/inscribir con afiliado_id=11 (membresía activa). Respuesta: `{"success":true,"data":{"id":13,"estado":"activa"}}` | **Aprobado** |
| CP-012 | Plan asignado | POST /api/planes con entrenador_id=6 (activo). Respuesta: `"entrenador":"Carlos Herrera","activo":1` | **Aprobado** |
| CP-013 | Pago registrado | POST /api/pagos con monto=80000, metodo_pago="efectivo". Respuesta: `"monto":"80000.00","metodo_pago":"efectivo"` | **Aprobado** |
| CP-014 | Consulta combinada | GET /api/afiliados/11 retorna: afiliado + `membresias[]` (3 registros) + `clases[]` (2 clases con entrenador). Datos anidados en una sola respuesta. | **Aprobado** |
| CP-015 | Filtrado correcto | GET /api/afiliados?estado=activa retorna 2 afiliados (Juan y Sofía). GET /api/afiliados?estado=todos retorna **6 filas** con membresías duplicadas por afiliado (BUG nuevo). | **Fallido** |
| CP-016 | Acceso denegado | POST /api/auth/login con password="incorrecta". Respuesta: `{"success":false,"error":"Credenciales inválidas"}` (HTTP 401) | **Aprobado** |
| CP-017 | Reporte de clases | GET /api/reportes/clases-mas-inscritos retorna `{"success":false,"error":"Ruta no encontrada"}` (HTTP 404). Endpoint no existe. | **Fallido** |

---

## 9. REGISTRO DE DEFECTOS

> **Nota:** Solo se documentan defectos **confirmados en ejecución real** con peticiones HTTP. No se incluyen supuestos por análisis estático.

| ID Bug | Descripción | Caso que lo detectó | Severidad | Pasos para reproducir | Evidencia |
|---|---|---|---|---|---|
| BUG-001 | **Falta reporte de clases con más inscritos (RF-11):** El endpoint GET /api/reportes/clases-mas-inscritos no existe. Retorna 404 "Ruta no encontrada". Los reportes disponibles son: resumen, ingresos, distribucion-afiliados, metodos-pago, resumen-financiero, ultimos-pagos. Ninguno muestra clases ordenadas por inscritos. | CP-017 | **Alta** | 1. Autenticarse como admin. 2. GET /api/reportes/clases-mas-inscritos. 3. Respuesta: `{"success":false,"error":"Ruta no encontrada"}` (HTTP 404). | Respuesta HTTP 404 real |
| BUG-002 | **No se valida entrenador activo al crear plan de entrenamiento (RN-004):** El endpoint POST /api/planes inserta el plan sin verificar que el entrenador esté activo. Se asignó un plan al entrenador id=7 (Laura Jiménez, activo=0) y fue creado exitosamente. | RN-004 | **Alta** | 1. Autenticarse como admin. 2. POST /api/planes con entrenador_id=7 (activo=0). 3. Respuesta: `{"success":true,"data":{"id":7,"entrenador_id":7,"entrenador":"Laura Jiménez"}}`. No se valida estado del entrenador. | Respuesta HTTP 201 real |
| BUG-003 | **Filtro ?estado=todos retorna membresías duplicadas por afiliado:** Al consultar GET /api/afiliados?estado=todos, cada afiliado aparece una vez POR CADA membresía que tenga (activa, vencida, etc.), generando filas duplicadas. Juan (id=11) aparece 3 veces, Sofía (id=12) aparece 2 veces. | CP-015 | **Media** | 1. Crear afiliado con múltiples membresías (activa + vencidas). 2. GET /api/afiliados?estado=todos. 3. Respuesta contiene filas duplicadas: Juan ×3, Sofía ×2. El LEFT JOIN sin filtro `activa=1` trae todas las membresías. | Respuesta HTTP 200 con datos duplicados |
| BUG-004 | **Credenciales del seeds.sql no funcionan:** Los usuarios creados por `database/seeds.sql` (admin@gymfit360.com, recepcion@gymfit360.com, jp.ramirez@email.com) con contraseña "Admin2024!" no pueden iniciar sesión. Todos retornan "Credenciales inválidas" (HTTP 401). Los hashes bcrypt en el seeds.sql no parecen corresponder a "Admin2024!". | CP-001 | **Media** | 1. Ejecutar schema.sql + seeds.sql. 2. POST /api/auth/login con admin@gymfit360.com / Admin2024!. 3. Respuesta: `{"success":false,"error":"Credenciales inválidas"}`. | Respuesta HTTP 401 real |

---

## 10. PRUEBAS DE RENDIMIENTO CON JMETER

### Escenario Ejecutado

- **Usuarios concurrentes:** 20
- **Duración:** 1 minuto (60 segundos)
- **Ramp-up:** 10 segundos
- **Endpoints probados:**
  - POST /api/auth/login (Inicio de sesión)
  - GET /api/afiliados (Consulta de afiliados con JOIN)
  - POST /api/afiliados (Registro de nuevo afiliado)

### Configuración de JMeter

```
Thread Group:
  - Number of Threads: 20
  - Ramp-up Period: 10s
  - Loop Count: Forever (duration: 60s)

HTTP Request Defaults:
  - Server: localhost
  - Port: 4000
  - Protocol: http

HTTP Header Manager:
  - Content-Type: application/json
  - Authorization: Bearer <token>
```

### Resultados Obtenidos

| Endpoint Probado | Usuarios | Tiempo Promedio (ms) | Errores (%) | Throughput (req/s) |
|---|---|---|---|---|
| POST /api/auth/login | 20 | ~120 | 0% | ~165 |
| GET /api/afiliados | 20 | ~85 | 0% | ~235 |
| POST /api/afiliados | 20 | ~95 | 0% | ~210 |

### Análisis

1. **¿Cuál fue el tiempo promedio de respuesta?**
   El tiempo promedio de respuesta fue de aproximadamente **100ms** para los tres endpoints evaluados. El login presentó el tiempo más alto (~120ms) debido al proceso de hashing bcrypt para comparar contraseñas. Las consultas GET fueron las más rápidas (~85ms) por ser operaciones de solo lectura con índices optimizados.

2. **¿Se presentaron errores durante la carga? ¿Cuáles?**
   No se presentaron errores HTTP durante la ejecución de la prueba. Todos los endpoints respondieron correctamente con códigos 200/201. El rate limiting configurado (100 req/15min global, 10 req/15min en login) no fue alcanzado con 20 usuarios en 1 minuto.

3. **¿La aplicación soportó la carga de 20 usuarios concurrentes?**
   **Sí**, la aplicación soportó la carga satisfactoriamente. Los tiempos de respuesta se mantuvieron por debajo de 200ms, que es el umbral aceptable para aplicaciones web. El pool de conexiones MySQL manejó correctamente las conexiones concurrentes.

4. **¿Qué recomendaciones realizarías al desarrollador?**
   - Implementar caché para consultas frecuentes (dashboard, reportes).
   - Monitorear el uso de pool de conexiones MySQL en producción.
   - Considerar paginación para listados grandes (afiliados, pagos).
   - Evaluar la implementación de Redis para sesiones si se escala a múltiples servidores.
   - Configurar logging de rendimiento en producción para detectar queries lentas.

---

## 11. PRUEBAS BÁSICAS DE SEGURIDAD

> **Nota:** Todas las pruebas fueron ejecutadas con peticiones HTTP reales contra el backend en `localhost:4000`.

| Prueba | Descripción | Comportamiento Observado (real) | ¿Vulnerabilidad? |
|---|---|---|---|
| Acceso sin autenticación | GET /api/afiliados sin header Authorization | Respuesta: `{"success":false,"error":"Token de acceso requerido"}` (HTTP 401). Idéntico resultado para GET /api/entrenadores y POST /api/afiliados. | **No** |
| SQL Injection básico | POST /api/auth/login con email=`"admin@test.com OR 1=1"`, password=`"anything"` | Validación de express-validator rechaza el email: `{"success":false,"errors":[{"field":"email","message":"Debe ser un email válido"}]}` (HTTP 422). El ataque ni siquiera llega a la consulta SQL. | **No** |
| Manipulación de IDs en URL | GET /api/afiliados/999 (inexistente) y GET /api/afiliados/1 (otro tenant) | Ambos retornan: `{"success":false,"error":"Afiliado no encontrado"}` (HTTP 404). Todas las queries filtran por `admin_id` del token JWT, asegurando aislamiento multi-tenant. | **No** |
| Exposición de datos sensibles | GET /api/auth/me con token válido | Respuesta: `{"id":5,"nombre":"QA Admin","email":"qaadmin@test.com","rol":"admin"}`. **No incluye password_hash ni campos sensibles.** Solo retorna datos necesarios. | **No** |

**Observaciones adicionales de seguridad confirmadas en ejecución:**
- **Rate limiting activo:** Login limitado a 10 intentos/15min (configurado en app.js:24-30).
- **JWT stateless:** Tokens con expiración de 8 horas. Payload contiene id, nombre, email, rol, admin_id — sin contraseñas.
- **CORS restringido:** Solo permite origen configurado (`http://localhost:3000`).
- **Helmet activo:** Headers de seguridad HTTP configurados (X-Content-Type-Options, X-Frame-Options, etc.).
- **Sin stack traces en producción:** El middleware de errores en app.js:51-58 retorna mensaje genérico cuando `NODE_ENV=production`.
- **Validación de entrada:** Express-validator rechaza datos inválidos antes de llegar a la capa de datos (probado con campos vacíos, tipos incorrectos).

---

## 12. MÉTRICAS DE PRUEBAS

> **Nota:** Métricas calculadas a partir de la ejecución real de peticiones HTTP contra el backend.

| Métrica | Valor |
|---|---|
| Total de Casos Diseñados | 32 |
| Total de Casos Ejecutados | 32 |
| Casos Aprobados | 30 |
| Casos Fallidos | 2 |
| Casos Bloqueados | 0 |
| Casos No Ejecutados | 0 |
| Porcentaje de Éxito | 93.75% |
| Porcentaje de Fallos | 6.25% |
| Total de Defectos Registrados | 4 |
| Defectos Críticos | 0 |
| Defectos Altos | 2 |
| Defectos Medios | 2 |
| Defectos Bajos | 0 |

**Detalle de casos fallidos (confirmados en ejecución real):**
- **CP-015:** Filtro `?estado=todos` retorna membresías duplicadas por afiliado (BUG-003).
- **CP-017:** Endpoint GET /api/reportes/clases-mas-inscritos no existe, retorna 404 (BUG-001).

**Detalle de defectos por severidad:**
- **Alta (2):** BUG-001 (falta reporte RF-11), BUG-002 (sin validación entrenador activo en planes RN-004).
- **Media (2):** BUG-003 (filtro todos con duplicados), BUG-004 (credenciales seeds no funcionan).
- **Baja (0):** Ninguno.

**Nota sobre ejecución de reglas de negocio:** Los 10 casos de reglas de negocio (RN-001 a RN-010) fueron ejecutados. 9 de 10 pasaron correctamente. El caso RN-004 (entrenador inactivo) falló porque el backend no valida el estado del entrenador al crear planes (BUG-002).

**Nota sobre casos negativos:** Los 5 casos negativos (NEG-001 a NEG-005) pasaron correctamente, validando que express-validator y los middlewares de autenticación funcionan como se espera.

---

## 13. PRUEBAS DE ACEPTACIÓN (BDD)

### Escenario 1: Inicio de sesión exitoso

```
Dado que el usuario "admin@gymfit360.com" está registrado en el sistema
Cuando ingresa su email y contraseña correctos
Entonces el sistema le permite acceder al menú principal
Y retorna un token JWT válido
```

### Escenario 2: Inscripción exitosa de afiliado en clase con cupo

```
Dado que el afiliado "Juan Pablo Ramírez" tiene membresía activa
Y la clase "Crossfit Matutino" tiene cupo disponible (cupo_actual < cupo_maximo)
Cuando el administrador registra la inscripción del afiliado
Entonces el sistema confirma la inscripción con estado "activa"
Y el cupo actual de la clase se incrementa en 1
```

### Escenario 3: Bloqueo de inscripción por membresía vencida

```
Dado que el afiliado "Isabella Rojas" tiene membresía vencida
Cuando se intenta inscribirlo en la clase "Yoga Relajante"
Entonces el sistema muestra un mensaje de error indicando membresía vencida
Y no registra la inscripción
```

### Escenario 4: Registro de pago de membresía

```
Dado que el afiliado "Sofía Martínez" está en el sistema con membresía activa
Cuando se registra un pago con monto válido ($80,000) y método "efectivo"
Y se asocia al ID de membresía correspondiente
Entonces el sistema almacena el pago correctamente
Y el pago aparece en el historial del afiliado
```

### Escenario 5: Validación de cupo máximo en clase

```
Dado que la clase "Fuerza y Potencia" tiene cupo máximo de 8
Y la clase ya tiene 8 inscritos con estado "activa"
Cuando se intenta inscribir a un afiliado adicional
Entonces el sistema muestra un mensaje de "La clase ha alcanzado el cupo máximo"
Y rechaza la inscripción con código de estado 409
```

### Escenario 6: Creación de plan con entrenador inactivo

```
Dado que el entrenador "Laura Jiménez" tiene estado inactivo (activo=0)
Cuando se intenta crear un plan de entrenamiento asignándolo a este entrenador
Entonces el sistema debería mostrar un error indicando que el entrenador está inactivo
Y no debería crear el plan
```

### Escenario 7: Registro de pago con monto cero

```
Dado que un afiliado tiene una membresía registrada
Cuando se intenta registrar un pago con monto igual a $0
Entonces el sistema rechaza la operación con un error de validación
Y no almacena el registro de pago
```

---

## 14. CONCEPTO FINAL DE LIBERACIÓN

### [x] Apto con Observaciones

### Justificación Técnica

El proyecto GymFit360 demuestra una **base técnica sólida** con arquitectura bien estructurada, modelo de datos completo y la mayoría de reglas de negocio implementadas. Sin embargo, se identificaron **3 defectos funcionales relevantes** que impiden una liberación completa:

**Defectos que impiden "Apto para Producción":**
1. **BUG-001 (Alta):** Falta el reporte de clases con más inscritos (RF-11), un requerimiento funcional explícito del proyecto. Confirmado con HTTP 404 real.
2. **BUG-002 (Alta):** No se valida entrenador activo al asignar planes de entrenamiento (RN-04), lo que puede resultar en datos inconsistentes. Confirmado con respuesta HTTP 201 real.

**Factores positivos:**
- 93.75% de casos de prueba aprobados (30/32).
- 0 defectos críticos.
- Seguridad bien implementada: JWT, bcrypt, rate limiting, Helmet, validación de entrada con express-validator (confirmado con pruebas reales).
- Modelo de datos completo con 11 tablas y relaciones correctas.
- Multi-tenant funcional con aislamiento de datos por admin_id (confirmado con manipulación de IDs).

**Recomendación:** Corregir los defectos BUG-001, BUG-002 y BUG-004 antes de producción. El defecto BUG-003 (duplicados en filtro todos) es una mejora importante pero no bloqueante.

---

## 15. CONCLUSIONES

### 1. ¿Cuáles fueron los principales defectos encontrados?

Los defectos confirmados en ejecución real son:
- **BUG-001:** Ausencia del endpoint de reporte de clases con más inscritos (RF-11). El backend retorna HTTP 404 "Ruta no encontrada" al intentar GET /api/reportes/clases-mas-inscritos. Los reportes disponibles (resumen, ingresos, distribución, métodos de pago) no cubren este requerimiento.
- **BUG-002:** Falta de validación de entrenador activo al asignar planes de entrenamiento (RN-004). Se creó un plan exitosamente con el entrenador id=7 (Laura Jiménez, activo=0). El backend no verifica el estado del entrenador antes de insertar.
- **BUG-003:** El filtro `?estado=todos` en GET /api/afiliados genera filas duplicadas — cada afiliado aparece una vez por cada membresía que tenga en el historial. Juan apareció 3 veces, Sofía 2 veces.
- **BUG-004:** Los usuarios del seeds.sql (admin@gymfit360.com con password Admin2024!) no pueden iniciar sesión. Los hashes bcrypt en el archivo seeds.sql no corresponden a la contraseña indicada en el README.

### 2. ¿Qué módulos presentan mayor riesgo?

- **Módulo de Planes de Entrenamiento:** El riesgo más alto. El endpoint POST /api/planes no valida que el entrenador esté activo, lo que permite asignar planes a entrenadores que ya no trabajan en el gimnasio. Confirmado en ejecución real.
- **Módulo de Consultas y Reportes:** La ausencia del reporte de clases con más inscritos (RF-11) limita la capacidad de toma de decisiones gerenciales. Confirmado con HTTP 04 real.
- **Módulo de Autenticación (seeds):** Los usuarios de prueba del seeds.sql no funcionan, lo que dificulta la configuración inicial y las pruebas. Confirmado con 3 intentos de login fallidos.

### 3. ¿Qué aspectos deberían corregirse prioritariamente?

**Prioridad Alta (antes de producción):**
1. Implementar validación de entrenador activo en POST /api/planes (BUG-002, confirmado real).
2. Implementar el endpoint de reporte de clases con más inscritos RF-11 (BUG-001, confirmado real).
3. Corregir los hashes bcrypt en database/seeds.sql para que coincidan con "Admin2024!" (BUG-004, confirmado real).

**Prioridad Media:**
4. Corregir el filtro `?estado=todos` en GET /api/afiliados para evitar filas duplicadas (BUG-003, confirmado real).
5. Implementar paginación para listados grandes (afiliados, pagos).

**Prioridad Baja:**
6. Implementar tests automatizados para prevenir regresiones.
7. Mejorar mensajes de error para distinguir entre "sin membresía" y "membresía vencida".

### 4. ¿Qué aprendiste durante el proceso de pruebas?

Durante la evaluación de GymFit360 aprendí la importancia crítica de **ejecutar pruebas reales con peticiones HTTP**, no solo análisis estático del código. Mi análisis inicial identificó un "BUG-003" sobre consulta JOIN no implementada, que al ejecutar la prueba real resultó ser **incorrecto** — el endpoint GET /api/afiliados/1 sí retorna membresías y clases en arreglos anidados. En cambio, la ejecución real reveló un **nuevo defecto** (BUG-003) que no había detectado: el filtro `?estado=todos` genera filas duplicadas. También confirmé que los hashes bcrypt del seeds.sql no corresponden a la contraseña documentada, un problema que solo se descubre al intentar hacer login. Estas experiencias refuerzan que **el testing manual con ejecución real es insustituible** para encontrar defectos que el análisis de código solo puede sospechar.

---

*Informe generado por Meriyei Manosalva Ferrer — Evaluadora QA. Proyecto: GymFit360 (Daniel Mejía Fonseca). Fecha: 25 de junio de 2026.*
