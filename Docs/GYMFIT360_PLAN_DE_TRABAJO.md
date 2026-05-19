# 🏋️ GymFit360 — Plan de Trabajo Individual
> **Stack:** Next.js (React) · Node.js + Express · MySQL  
> **Prioridad crítica:** Validaciones en cada capa (DB → Backend → Frontend)  
> **Principio de avance:** Cada paso cierra un ciclo antes de pasar al siguiente (DB → API → UI → Validación → Siguiente módulo)

---

## 🛡️ Stack Tecnológico Recomendado

### Backend (Node.js + Express)
| Tecnología | Propósito | Por qué usarla |
|---|---|---|
| **Express.js** | Framework HTTP | Base del servidor |
| **express-validator** | Validaciones en rutas | Middleware declarativo, fácil de auditar |
| **Joi** | Validación de esquemas de objetos | Complementa express-validator para schemas complejos |
| **jsonwebtoken (JWT)** | Autenticación stateless | Tokens firmados con expiración configurable |
| **bcryptjs** | Hash de contraseñas | Nunca guardar contraseñas en texto plano |
| **helmet** | Headers HTTP de seguridad | Protege contra XSS, clickjacking, MIME sniffing |
| **cors** | Control de origen cruzado | Solo permite peticiones desde tu frontend |
| **express-rate-limit** | Límite de peticiones | Previene ataques de fuerza bruta en login |
| **morgan** | Logging de peticiones | Trazabilidad en desarrollo y producción |
| **dotenv** | Variables de entorno | Nunca hardcodear credenciales |
| **mysql2** | Driver de MySQL nativo | Consultas parametrizadas con prepared statements, promesas nativas |

### Frontend (Next.js)
| Tecnología | Propósito | Por qué usarla |
|---|---|---|
| **Next.js 14+ (App Router)** | Framework React | SSR/SSG, rutas, middleware de auth integrado |
| **React Hook Form** | Manejo de formularios | Validación eficiente, mínimo re-render |
| **Zod** | Esquemas de validación | Comparte tipos entre frontend y backend (TypeScript) |
| **@hookform/resolvers** | Integración RHF + Zod | Validación declarativa en formularios |
| **Axios** | Cliente HTTP | Interceptores globales para tokens y errores |
| **TanStack Query (React Query)** | Cache y estado servidor | Evita llamadas redundantes, loading/error automático |
| **shadcn/ui + Tailwind CSS** | UI components | Accesible, personalizable, rápido de montar |
| **next-auth** | Sesiones y protección de rutas | Integra JWT con middleware de Next.js |
| **Lucide React** | Iconografía | Ligero y consistente |

### Base de Datos
| Tecnología | Propósito |
|---|---|
| **MySQL 8+** | SGBD principal |
| **Constraints nativos** | `CHECK`, `NOT NULL`, `UNIQUE` — primera línea de validación |
| **Triggers MySQL** | Reglas de negocio complejas (ej. cupo de clase) |

---

## 📐 FASE 0 — Diseño y Arquitectura
> Antes de escribir una sola línea de código. Sin esta fase, todo lo demás se construye sobre arena.

---

### ✅ Paso 0.1 — Modelo Entidad-Relación (MER)
**Entregable:** Diagrama MER en papel o herramienta (dbdiagram.io / draw.io)

Entidades mínimas a identificar:
- `usuarios` — autenticación al sistema
- `afiliados` — datos personales + estado membresía
- `entrenadores` — especialidad + activo/inactivo
- `tipos_membresia` — nombre, duración, precio
- `membresias` — membresía asignada a un afiliado (1:N con afiliados)
- `pagos` — historial de pagos de membresía
- `clases` — nombre, horario, entrenador, cupo máximo
- `inscripciones_clases` — tabla intermedia afiliado ↔ clase (N:M)
- `planes_entrenamiento` — plan asignado por entrenador a afiliado

**Relaciones clave a documentar:**
- `afiliados` 1:N `membresias`
- `afiliados` N:M `clases` (a través de `inscripciones_clases`)
- `entrenadores` 1:N `clases`
- `entrenadores` 1:N `planes_entrenamiento`
- `afiliados` 1:N `planes_entrenamiento`
- `tipos_membresia` 1:N `membresias`

---

### ✅ Paso 0.2 — Modelo Relacional
**Entregable:** Tablas con PKs, FKs, tipos de dato y constraints anotados

Para cada tabla documentar:
- PK (preferir `AUTO_INCREMENT` o `UUID`)
- FKs con `ON DELETE` y `ON UPDATE` definidos
- Constraints de negocio: `CHECK (monto > 0)`, `CHECK (cupo_maximo > 0)`, etc.
- Campos obligatorios (`NOT NULL`) vs opcionales

---

### ✅ Paso 0.3 — Estructura de Carpetas del Proyecto
**Entregable:** Repositorio GitHub creado con estructura base

```
gymfit360/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env validation
│   │   ├── middlewares/     # auth, validation, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── afiliados/
│   │   │   ├── entrenadores/
│   │   │   ├── membresias/
│   │   │   ├── clases/
│   │   │   ├── planes/
│   │   │   └── reportes/
│   │   ├── routes/          # index de rutas
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/                 # App Router de Next.js
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── afiliados/
│   │   │   ├── entrenadores/
│   │   │   ├── membresias/
│   │   │   ├── clases/
│   │   │   ├── planes/
│   │   │   └── reportes/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── forms/           # formularios reutilizables
│   │   └── tables/          # tablas reutilizables
│   ├── lib/
│   │   ├── api.ts           # cliente Axios configurado
│   │   ├── schemas/         # esquemas Zod compartidos
│   │   └── utils.ts
│   └── package.json
│
├── database/
│   ├── schema.sql           # CREATE TABLE scripts
│   ├── seeds.sql            # datos de prueba
│   └── migrations/
│
└── README.md
```

---

## 🗄️ FASE 1 — Base de Datos
> La base de datos es la primera y más importante capa de validación.

---

### ✅ Paso 1.1 — Script SQL: Tablas y Constraints
**Entregable:** `database/schema.sql` funcional

Orden de creación (respetar dependencias de FK):
1. `usuarios`
2. `tipos_membresia`
3. `entrenadores`
4. `afiliados`
5. `membresias`
6. `pagos`
7. `clases`
8. `inscripciones_clases`
9. `planes_entrenamiento`

**Constraints de negocio en la DB (crítico para validaciones):**
```sql
-- Ejemplo de constraints obligatorios
ALTER TABLE pagos ADD CONSTRAINT chk_monto_positivo CHECK (monto > 0);
ALTER TABLE clases ADD CONSTRAINT chk_cupo_positivo CHECK (cupo_maximo > 0);
ALTER TABLE membresias ADD CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio);
ALTER TABLE inscripciones_clases ADD CONSTRAINT uq_afiliado_clase UNIQUE (afiliado_id, clase_id);
```

---

### ✅ Paso 1.2 — Datos de Prueba
**Entregable:** `database/seeds.sql`

Incluir al menos:
- 2 usuarios del sistema
- 3 tipos de membresía
- 5 entrenadores (3 activos, 2 inactivos)
- 10 afiliados con distintos estados de membresía (activa, vencida, próxima a vencer)
- 6 clases grupales con distintos cupos
- Inscripciones de prueba
- Pagos de membresía

---

## ⚙️ FASE 2 — Backend: Configuración Base
> Montar el servidor, conexión a DB, seguridad global y autenticación antes de cualquier módulo.

---

### ✅ Paso 2.1 — Setup del Servidor Express
**Entregable:** `backend/src/app.js` corriendo en puerto configurado por `.env`

```js
// Paquetes a instalar
npm install express mysql2 helmet cors express-rate-limit morgan dotenv bcryptjs jsonwebtoken express-validator
```

Checklist de configuración inicial:
- [ ] `helmet()` aplicado globalmente
- [ ] `cors()` con `origin` restringido al dominio del frontend
- [ ] `express.json()` con límite de tamaño (`limit: '10kb'`)
- [ ] `morgan('dev')` para logging
- [ ] `rate-limit` en todas las rutas (`max: 100` req/15min) y más estricto en `/auth/login` (`max: 10`)
- [ ] Manejo global de errores con middleware `errorHandler`

---

### ✅ Paso 2.2 — Módulo de Autenticación (Backend)
**Entregable:** Rutas `/api/auth/login` y `/api/auth/me` funcionando

Pasos internos:
1. Crear `POST /auth/login` con `express-validator`:
   - Validar que `email` sea formato correcto y no vacío
   - Validar que `password` tenga mínimo 6 caracteres
   - Comparar hash con `bcrypt.compare()`
   - Retornar JWT firmado con `expiresIn: '8h'`
2. Crear middleware `authenticateToken` que verifique JWT en header `Authorization: Bearer`
3. Crear `GET /auth/me` (protegido) que retorne datos del usuario autenticado

**Seguridad crítica:**
- El JWT payload NO debe incluir contraseña ni datos sensibles
- Usar `JWT_SECRET` desde `.env`, mínimo 32 caracteres aleatorios
- En error de login retornar siempre `401 Credenciales inválidas` (no diferenciar si es email o contraseña incorrecta)

---

### ✅ Paso 2.3 — Middleware de Validación Reutilizable
**Entregable:** `backend/src/middlewares/validate.js`

```js
// Middleware que centraliza el manejo de errores de express-validator
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};
```

Este middleware se reutiliza en TODOS los módulos siguientes.

---

### ✅ Paso 2.4 — Registro de Usuarios (Backend)
**Entregable:** Ruta `POST /api/auth/register`

Ruta a crear:
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crear nuevo usuario |

Validaciones backend (express-validator):
- `nombre`: requerido, 2-100 caracteres
- `email`: formato válido, único en tabla `usuarios`
- `password`: mínimo 6 caracteres
- `rol`: opcional, DEFAULT 'recepcionista'

Reglas de negocio:
- Hash de password con bcrypt (cost 10) antes de insertar
- No exponer si el email ya existe en el mensaje de error (seguridad)
- Retornar JWT + datos del usuario (sin password_hash)
- Rate limit: 5 registros por IP cada 15 minutos

---

## 🌐 FASE 3 — Frontend: Configuración Base y Login
> Montar Next.js, sistema de rutas protegidas y el primer flujo completo end-to-end.

---

### ✅ Paso 3.1 — Setup de Next.js y Dependencias
**Entregable:** Proyecto Next.js con shadcn/ui configurado

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn-ui@latest init
npm install axios @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react
```

Configuración base:
- [ ] Axios instance en `lib/api.ts` con `baseURL` desde `.env.local` y interceptor para agregar JWT en headers
- [ ] `QueryClientProvider` en el layout raíz
- [ ] Esquema de colores en `tailwind.config.ts`
- [ ] Tipografía y tema base en `globals.css`

---

### ✅ Paso 3.2 — Módulo de Login (Frontend)
**Entregable:** Pantalla `/login` funcional con validación completa

Checklist de validaciones en formulario:
- [ ] Email: formato válido, campo requerido (Zod: `z.string().email()`)
- [ ] Password: mínimo 6 caracteres, campo requerido
- [ ] Deshabilitar botón mientras se procesa la petición
- [ ] Mostrar errores inline bajo cada campo
- [ ] Mostrar mensaje de error global si las credenciales son inválidas
- [ ] Guardar JWT en `httpOnly cookie` o `localStorage` (preferir cookie para seguridad)
- [ ] Redirigir a `/dashboard` tras login exitoso

---

### ✅ Paso 3.3 — Protección de Rutas y Layout del Dashboard
**Entregable:** Middleware `middleware.ts` de Next.js + layout con navbar

- Rutas bajo `/(dashboard)` redirigen a `/login` si no hay JWT válido
- Navbar lateral con enlaces a todos los módulos
- Componente `UserMenu` con opción de cerrar sesión (limpiar token + redirect)

---

### ✅ Paso 3.4 — Página de Registro (Frontend)
**Entregable:** Pantalla `/register` funcional con validación completa

- [ ] Formulario con campos: nombre, email, password, confirmar password
- [ ] Validación Zod: email válido (z.string().email()), password ≥ 6 chars, confirmación coincide
- [ ] Botón deshabilitado durante envío (evitar doble submit)
- [ ] Mostrar errores inline debajo de cada campo
- [ ] Mostrar mensaje de error global si el registro falla
- [ ] Redirigir a `/dashboard` tras registro exitoso
- [ ] Enlace "¿Ya tienes cuenta? Inicia sesión" en el pie del formulario

---

## 👥 FASE 4 — Módulo de Afiliados (Ciclo completo)
> Primer módulo de dominio. Sirve como plantilla para todos los demás.

---

### ✅ Paso 4.1 — Backend: CRUD de Afiliados
**Entregable:** Rutas `/api/afiliados` con validaciones completas

Rutas a crear:
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/afiliados` | Listar con filtros (activo/vencido/próximo) |
| GET | `/api/afiliados/:id` | Detalle con membresía y clases inscritas |
| POST | `/api/afiliados` | Crear afiliado |
| PUT | `/api/afiliados/:id` | Actualizar afiliado |
| DELETE | `/api/afiliados/:id` | Eliminar (verificar dependencias) |

**Validaciones backend obligatorias:**
- `nombre`: requerido, entre 2 y 100 caracteres, solo letras y espacios
- `email`: formato válido, único en la tabla
- `telefono`: formato numérico, opcional
- `fecha_nacimiento`: fecha válida, no futura
- `fecha_ingreso`: fecha válida, no futura
- Al eliminar: verificar si tiene inscripciones activas o planes activos

**Filtro de estado de membresía (query param `?estado=`):**
```sql
-- Activa
WHERE m.fecha_fin >= CURRENT_DATE

-- Próxima a vencer (7 días)
WHERE m.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 7 DAY

-- Vencida
WHERE m.fecha_fin < CURRENT_DATE
```

---

### ✅ Paso 4.2 — Frontend: CRUD de Afiliados
**Entregable:** Página `/dashboard/afiliados` con tabla y formulario

Checklist UI/UX:
- [ ] Tabla con columnas: nombre, email, teléfono, membresía, estado membresía
- [ ] Badge de color por estado: verde (activa) / amarillo (próxima) / rojo (vencida)
- [ ] Filtros en la parte superior (por estado de membresía)
- [ ] Botón "Nuevo Afiliado" abre modal o navega a formulario
- [ ] Formulario con validación Zod + React Hook Form (mismas reglas que el backend)
- [ ] Confirmación antes de eliminar: `"¿Estás seguro de eliminar a [nombre]?"`
- [ ] Toast de éxito/error tras cada operación

---

## 🏃 FASE 5 — Módulo de Entrenadores (Ciclo completo)

---

### ✅ Paso 5.1 — Backend: CRUD de Entrenadores
**Rutas:** `/api/entrenadores`

**Validaciones backend obligatorias:**
- `nombre`: requerido, 2-100 caracteres
- `especialidad`: requerido, texto libre máx 200 caracteres
- `email`: único, formato válido
- `activo`: booleano, default `true`
- Al desactivar entrenador: verificar si tiene clases futuras programadas → advertir
- Al desactivar: no eliminar, solo cambiar `activo = false` (baja lógica)

---

### ✅ Paso 5.2 — Frontend: CRUD de Entrenadores
**Entregable:** Página `/dashboard/entrenadores`

- [ ] Tabla con columnas: nombre, especialidad, email, estado (activo/inactivo)
- [ ] Toggle de estado activo/inactivo con confirmación
- [ ] Formulario con los mismos campos validados

---

## 💳 FASE 6 — Módulo de Membresías y Pagos (Ciclo completo)
> Módulo crítico por las reglas de negocio de vencimiento y montos.

---

### ✅ Paso 6.1 — Backend: Tipos de Membresía
**Rutas:** `/api/tipos-membresia`

**Validaciones:**
- `nombre`: único, requerido
- `duracion_dias`: entero positivo (`CHECK (duracion_dias > 0)`)
- `precio`: decimal positivo (`CHECK (precio > 0)`)

---

### ✅ Paso 6.2 — Backend: Asignación y Pagos de Membresía
**Rutas:** `/api/membresias` y `/api/pagos`

**Reglas de negocio críticas:**
```
POST /api/membresias
  → Calcular fecha_fin = fecha_inicio + tipo_membresia.duracion_dias
  → Si el afiliado ya tiene una membresía activa: preguntar si desea extender o reemplazar

POST /api/pagos
  → Validar monto > 0 (nunca negativo ni cero)
  → Validar que membresia_id exista y pertenezca al afiliado
  → Registrar fecha_pago = NOW() por defecto
```

---

### ✅ Paso 6.3 — Frontend: Membresías y Pagos
**Entregable:** Página `/dashboard/membresias`

- [ ] Listado de membresías por afiliado con estado visual
- [ ] Formulario para asignar nueva membresía (select de afiliado + tipo membresía)
- [ ] Sección de registro de pagos con validación de monto > 0
- [ ] Historial de pagos por membresía

---

## 🏃 FASE 7 — Módulo de Clases Grupales (Ciclo completo)
> Módulo con la lógica más compleja de validación: cupo, doble inscripción, membresía activa.

---

### ✅ Paso 7.1 — Backend: CRUD de Clases
**Rutas:** `/api/clases`

**Validaciones:**
- `nombre`: requerido, único
- `horario`: formato datetime válido, no en el pasado para nuevas clases
- `entrenador_id`: debe existir y estar activo
- `cupo_maximo`: entero positivo
- Al editar cupo: no puede ser menor a los inscritos actuales

---

### ✅ Paso 7.2 — Backend: Inscripciones a Clases (Lógica crítica)
**Ruta:** `POST /api/clases/:id/inscribir`

**Validaciones encadenadas (en este orden):**
1. Verificar que el afiliado existe
2. **Verificar que el afiliado tiene membresía activa** → si no: `403 "Debes renovar tu membresía para inscribirte"`
3. Verificar que la clase existe
4. **Verificar que no está ya inscrito** → `409 "Ya estás inscrito en esta clase"`
5. **Verificar cupo disponible** → `409 "La clase está llena (X/X inscritos)"`
6. Si pasa todas: registrar inscripción

```js
// Lógica de verificación de cupo (consulta atómica)
const result = await pool.query(`
  SELECT 
    c.cupo_maximo,
    COUNT(ic.id) AS inscritos_actuales,
    (c.cupo_maximo - COUNT(ic.id)) AS cupos_disponibles
  FROM clases c
  LEFT JOIN inscripciones_clases ic ON ic.clase_id = c.id
  WHERE c.id = $1
  GROUP BY c.id
`, [clase_id]);

if (result.rows[0].cupos_disponibles <= 0) {
  throw new Error('CLASE_LLENA');
}
```

---

### ✅ Paso 7.3 — Frontend: Clases e Inscripciones
**Entregable:** Página `/dashboard/clases`

- [ ] Tarjetas de clases con: nombre, horario, entrenador, inscritos/cupo
- [ ] Barra de progreso visual del cupo (verde/amarillo/rojo)
- [ ] Botón "Inscribir afiliado" con select de afiliados (filtrado solo afiliados con membresía activa)
- [ ] Mensajes de error claros para cupo lleno, doble inscripción, membresía vencida

---

## 📋 FASE 8 — Módulo de Planes de Entrenamiento (Ciclo completo)

---

### ✅ Paso 8.1 — Backend: Planes de Entrenamiento
**Rutas:** `/api/planes`

**Regla de negocio crítica:**
- **No se puede asignar un plan si el entrenador está inactivo** → verificar `entrenadores.activo = true` antes de insertar
- `descripcion`: requerida, máx 1000 caracteres
- `fecha_inicio`: requerida, no en el pasado

---

### ✅ Paso 8.2 — Frontend: Planes de Entrenamiento
**Entregable:** Página `/dashboard/planes`

- [ ] Listado de planes por afiliado
- [ ] Formulario: select de afiliado + select de entrenador (solo activos) + descripción + fechas
- [ ] El select de entrenadores filtra automáticamente solo los activos
- [ ] Validación de que el entrenador seleccionado esté activo antes de enviar

---

## 📊 FASE 9 — Módulo de Consultas y Reportes (Ciclo completo)

---

### ✅ Paso 9.1 — Backend: Queries de Reportes
**Rutas:** `/api/reportes`

Consultas a implementar:

**1. Afiliados con información completa (JOIN)**
```sql
SELECT 
  a.nombre, a.email,
  tm.nombre AS tipo_membresia,
  m.fecha_fin,
  CASE 
    WHEN m.fecha_fin < CURRENT_DATE THEN 'VENCIDA'
    WHEN m.fecha_fin <= CURRENT_DATE + 7 THEN 'POR_VENCER'
    ELSE 'ACTIVA'
  END AS estado_membresia,
  COUNT(DISTINCT ic.clase_id) AS clases_inscritas
FROM afiliados a
LEFT JOIN membresias m ON m.afiliado_id = a.id AND m.activa = true
LEFT JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
LEFT JOIN inscripciones_clases ic ON ic.afiliado_id = a.id
GROUP BY a.id, m.fecha_fin, tm.nombre;
```

**2. Clases con mayor número de inscritos**
```sql
SELECT 
  c.nombre,
  c.horario,
  e.nombre AS entrenador,
  c.cupo_maximo,
  COUNT(ic.id) AS total_inscritos,
  ROUND((COUNT(ic.id)::decimal / c.cupo_maximo) * 100, 1) AS porcentaje_ocupacion
FROM clases c
LEFT JOIN inscripciones_clases ic ON ic.clase_id = c.id
LEFT JOIN entrenadores e ON e.id = c.entrenador_id
GROUP BY c.id, e.nombre
ORDER BY total_inscritos DESC;
```

**3. Afiliados con membresía próxima a vencer (7 días)**
```sql
SELECT a.nombre, a.email, a.telefono, m.fecha_fin,
  (m.fecha_fin - CURRENT_DATE) AS dias_restantes
FROM afiliados a
JOIN membresias m ON m.afiliado_id = a.id
WHERE m.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 7 DAY
ORDER BY m.fecha_fin ASC;
```

---

### ✅ Paso 9.2 — Frontend: Dashboard de Reportes
**Entregable:** Página `/dashboard/reportes`

- [ ] Tabla de afiliados con estado de membresía filtrable
- [ ] Ranking de clases más populares con barra de ocupación
- [ ] Panel de alertas: afiliados con membresía vencida y próxima a vencer
- [ ] Exportar tabla a CSV (opcional, botón de descarga)

---

## 🔒 FASE 10 — Refuerzo de Validaciones y Seguridad Global
> Esta fase revisa TODO el proyecto con ojos de auditor.

---

### ✅ Paso 10.1 — Auditoría de Validaciones Backend

Recorrer todos los módulos y verificar:
- [ ] Todos los endpoints protegidos con `authenticateToken`
- [ ] Todos los `POST` y `PUT` tienen `express-validator` + middleware `validate`
- [ ] Ninguna query usa concatenación de strings (solo `$1, $2` parametrizados)
- [ ] Respuestas de error no exponen stack traces en producción (`NODE_ENV=production`)
- [ ] `DELETE` siempre verifica dependencias antes de eliminar
- [ ] Montos nunca aceptan valores ≤ 0
- [ ] Cupos nunca se exceden (verificación antes de INSERT)

---

### ✅ Paso 10.2 — Auditoría de Validaciones Frontend

Recorrer todos los formularios y verificar:
- [ ] Todos los campos obligatorios marcados con `*` y mensaje de error visible
- [ ] Validación con Zod activa en cada formulario antes de enviar
- [ ] Los errores del backend se muestran al usuario (no solo en consola)
- [ ] Botones deshabilitados durante peticiones en curso (evitar doble submit)
- [ ] Campos numéricos no aceptan negativos ni letras
- [ ] Fechas de inicio no pueden ser mayores a fechas de fin

---

### ✅ Paso 10.3 — Variables de Entorno y Configuración Final
- [ ] `.env.example` creado con todas las variables necesarias (sin valores reales)
- [ ] `.env` en `.gitignore`
- [ ] `JWT_SECRET` de al menos 32 caracteres
- [ ] `CORS_ORIGIN` apunta solo al dominio del frontend
- [ ] Contraseñas en `seeds.sql` hasheadas con bcrypt

---

## 📁 FASE 11 — Entregables Finales y GitHub

---

### ✅ Paso 11.1 — README.md
Crear `README.md` en la raíz del repositorio con:
- Nombre del proyecto y descripción breve
- Lista de módulos implementados
- Stack tecnológico completo
- Instrucciones de instalación paso a paso (backend y frontend)
- Instrucciones para cargar la base de datos (`schema.sql` + `seeds.sql`)
- Variables de entorno necesarias (referenciar `.env.example`)
- Nombre del autor

---

### ✅ Paso 11.2 — Evidencias de Funcionamiento
Capturar screenshots de:
- [ ] Pantalla de login
- [ ] Dashboard principal con navbar
- [ ] CRUD completo de afiliados (lista, formulario, edición, eliminación)
- [ ] CRUD completo de entrenadores
- [ ] Asignación de membresía y registro de pago
- [ ] CRUD de clases con cupo visible
- [ ] Intento de inscripción con membresía vencida (error visible)
- [ ] Intento de inscripción con cupo lleno (error visible)
- [ ] Asignación de plan con entrenador inactivo (error visible)
- [ ] Dashboard de reportes con datos

---

### ✅ Paso 11.3 — Repositorio GitHub
- [ ] Repositorio público creado con nombre `gymfit360` o `GymFit360`
- [ ] Estructura de carpetas limpia y organizada
- [ ] `schema.sql` y `seeds.sql` en carpeta `/database`
- [ ] `.env.example` en backend y frontend
- [ ] README.md completo en la raíz
- [ ] Sin archivos `node_modules`, `.env` ni datos sensibles subidos

---

## 📅 Orden de Avance Sugerido (Resumen)

```
FASE 0: Diseño DB y arquitectura (sin código)
  └─→ FASE 1: Base de datos (schema + seeds)
        └─→ FASE 2: Backend base (servidor + auth + middleware validación + registro)
              └─→ FASE 3: Frontend base (Next.js + login + registro + rutas protegidas)
                    └─→ FASE 4: Afiliados (backend → frontend)
                          └─→ FASE 5: Entrenadores (backend → frontend)
                                └─→ FASE 6: Membresías y Pagos (backend → frontend)
                                      └─→ FASE 7: Clases e Inscripciones (backend → frontend)
                                            └─→ FASE 8: Planes de Entrenamiento (backend → frontend)
                                                  └─→ FASE 9: Reportes (backend → frontend)
                                                        └─→ FASE 10: Auditoría de validaciones
                                                              └─→ FASE 11: Entregables y GitHub
```

---

> 💡 **Regla de oro:** Nunca avanzar al siguiente módulo si el anterior tiene validaciones incompletas. Una validación que falta en producción es un bug que se convierte en reporte de error en la revisión.
