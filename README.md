# GymFit360

Sistema de gestion integral para gimnasios construido con **Next.js 16**, **Express 5** y **MySQL 8**.

## Requisitos previos

| Herramienta | Version    |
|-------------|------------|
| Node.js     | 20.x       |
| MySQL       | 8.0.13+    |
| npm         | 10.x       |

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio> gymfit360
cd gymfit360
```

### 2. Base de datos

Abre tu cliente MySQL (Workbench, CLI, DBeaver, etc.) y ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS gymfit360_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

Luego ejecuta el esquema:

```bash
# Desde terminal (con mysql CLI)
mysql -u root -p gymfit360_db < database/schema.sql
```

O abre `database/schema.sql` en tu cliente grafico y ejecutalo.

#### Datos de prueba (opcional)

Ejecuta `database/seeds.sql` para poblar la base con datos demo (tipos de membresia, entrenadores, afiliados, pagos, clases, planes y usuarios de prueba).

```bash
mysql -u root -p gymfit360_db < database/seeds.sql
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```env
# Obligatorio
DB_PASSWORD=tu_contraseña_mysql
JWT_SECRET=genera_un_secreto_aleatorio_de_32_caracteres

# Opcional (sin SMTP los codigos se muestran en consola)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu.correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

| Variable            | Obligatoria | Por defecto                    | Descripcion                        |
|---------------------|-------------|--------------------------------|------------------------------------|
| `PORT`              | No          | `4000`                         | Puerto del servidor                |
| `DB_HOST`           | No          | `localhost`                    | Host de MySQL                      |
| `DB_PORT`           | No          | `3306`                         | Puerto de MySQL                    |
| `DB_USER`           | No          | `root`                         | Usuario de MySQL                   |
| `DB_PASSWORD`       | **Si**      | —                              | Contraseña de MySQL                |
| `DB_NAME`           | No          | `gymfit360_db`                 | Nombre de la base de datos         |
| `JWT_SECRET`        | **Si**      | —                              | Secreto JWT (min. 32 caracteres)   |
| `JWT_EXPIRES_IN`    | No          | `8h`                           | Duracion del token                 |
| `CORS_ORIGIN`       | No          | `http://localhost:3000`        | Origen permitido para CORS         |
| `NODE_ENV`          | No          | `development`                  | Entorno (development/production)   |
| `GYM_NOMBRE`        | No          | `GymFit360`                    | Nombre del gimnasio                |
| `GYM_DIRECCION`     | No          | `Calle 123 #45-67, Bogota`     | Direccion del gimnasio             |
| `GYM_TELEFONO`      | No          | `+57 300 000 0000`             | Telefono del gimnasio              |
| `GYM_LOGO`          | No          | `/logo.png`                    | Ruta del logo                      |
| `SMTP_HOST`         | No          | (vacio)                        | Servidor SMTP                      |
| `SMTP_PORT`         | No          | `587`                          | Puerto SMTP                        |
| `SMTP_SECURE`       | No          | `false`                        | Usar TLS                           |
| `SMTP_USER`         | No          | (vacio)                        | Usuario SMTP                       |
| `SMTP_PASS`         | No          | (vacio)                        | Contraseña SMTP                    |
| `SMTP_FROM`         | No          | `GymFit360 <noreply@gymfit360.com>` | Remitente de correos          |
| `CONTACT_EMAIL`     | No          | (fallback a SMTP_USER)         | Destino del formulario de contacto |

### 4. Frontend

```bash
cd frontend
npm install
```

Crea el archivo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

> Si el backend corre en otro puerto o maquina, ajusta esta URL.

### 5. Iniciar

#### Terminal 1 — Backend (puerto 4000)

```bash
cd backend
npm run dev
```

Salida esperada: `GymFit360 API corriendo en puerto 4000`

#### Terminal 2 — Frontend (puerto 3000)

```bash
cd frontend
npm run dev
```

Abre **http://localhost:3000** en el navegador.

## Usuarios de prueba

Requiere haber ejecutado `database/seeds.sql`. Las contraseñas estan
hasheadas con bcrypt (cost 10) y los usuarios ya vienen pre-verificados
(`verificado = 1`), listos para iniciar sesion sin paso adicional.

| Rol             | Email                         | Contraseña   |
|-----------------|-------------------------------|--------------|
| Admin           | admin@gymfit360.com           | Admin2024!   |
| Recepcionista   | recepcionista@gymfit360.com   | Admin2024!   |
| Usuario         | jp.ramirez@email.com          | Admin2024!   |

> **Codigo de registro para nuevos admins:** `GYM360-ADMIN-2026`
> (se inserta automaticamente con `seeds.sql`).

## Comandos

### Backend

| Comando       | Descripcion                          |
|---------------|--------------------------------------|
| `npm run dev` | Desarrollo con recarga automatica   |
| `npm start`   | Produccion                           |

### Frontend

| Comando         | Descripcion                |
|-----------------|----------------------------|
| `npm run dev`   | Servidor de desarrollo     |
| `npm run build` | Compilar para produccion   |
| `npm start`     | Servidor de produccion     |
| `npm run lint`  | ESLint                     |

## Stack

| Capa              | Tecnologia                                                                          |
|-------------------|-------------------------------------------------------------------------------------|
| **Frontend**      | Next.js 16.2.6, React 19, shadcn/ui v4, React Query, Axios, react-hook-form         |
| **Backend**       | Express 5, mysql2, JWT, bcryptjs, helmet, cors, express-validator, express-rate-limit |
| **Base de datos** | MySQL 8.0.13+, InnoDB, utf8mb4                                                      |
| **Autenticacion** | JWT stateless con expiracion de 8h, contraseñas hasheadas con bcrypt                |

## Modulos implementados

| Modulo                                    | Backend | Frontend |
|-------------------------------------------|---------|----------|
| Autenticacion (login, registro, JWT)      | ✅       | ✅        |
| Afiliados (CRUD + filtro por membresia)    | ✅       | ✅        |
| Entrenadores (CRUD + baja logica)          | ✅       | ✅        |
| Tipos de Membresia (catalogo de planes)    | ✅       | ✅        |
| Membresias (asignacion + renovacion)       | ✅       | ✅        |
| Pagos (registro por membresia)            | ✅       | ✅        |
| Clases grupales (CRUD + inscripciones)    | ✅       | ✅        |
| Planes de entrenamiento (asignacion)      | ✅       | ✅        |
| Reportes (resumen, ingresos, distribucion, clases + inscritas, metodos de pago) | ✅ | ✅ |
| Validacion entrenador activo en planes (RN-04) | ✅       | —        |

## Estructura del proyecto

```
gymfit360/
├── backend/                 # API REST (Express 5)
│   ├── .env.example
│   ├── package.json
│   ├── uploads/             # Archivos subidos
│   └── src/
│       ├── app.js           # Punto de entrada
│       ├── config/db.js     # Conexion MySQL (pool)
│       ├── modules/         # auth, afiliados, entrenadores, membresias, etc.
│       ├── middlewares/     # auth JWT, validate
│       ├── routes/          # Agregador de rutas
│       └── services/        # email, upload
├── frontend/                # App Next.js 16 (TypeScript)
│   ├── app/
│   │   ├── (auth)/          # login, register, verificar-cuenta, etc.
│   │   ├── (dashboard)/     # afiliados, entrenadores, membresias, clases, etc.
│   │   └── mi-perfil/       # Perfil de usuario
│   ├── components/ui/       # Componentes shadcn/ui
│   └── lib/                 # api.ts (axios), utils.ts
├── database/                # schema.sql, seeds.sql
└── Docs/                    # Documentos de diseño
```

## Notas

- **Correo electronico**: si no configuras SMTP, los codigos de verificacion y restablecimiento de contraseña se imprimen en la consola del backend (modo mock).
- **Archivos subidos**: la carpeta `backend/uploads/` se crea automaticamente al iniciar el servidor.
- **Rate limiting**: 100 peticiones cada 15 minutos (global), 10 peticiones cada 15 minutos en login y 1 por IP en formulario de contacto.
- **Roles de usuario**: `admin` y `recepcionista` acceden al dashboard. El rol `usuario` solo accede a `mi-perfil`.
- **Seguridad**: Helmet, CORS restringido, rate limiting, sin stack traces en produccion.
- **Usuarios semilla**: los 3 usuarios de `seeds.sql` ya vienen con `verificado = 1`. Si creas un usuario desde la interfaz de registro, debera verificar su correo.
- **Planes de entrenamiento**: el backend rechaza asignar un plan a un entrenador inactivo (`activo = 0`). Retorna HTTP 400 con mensaje descriptivo.
- **Reportes**: el endpoint `GET /api/reportes/clases-mas-inscritos` devuelve las clases ordenadas por cantidad de inscripciones activas.

## Solucion de problemas

**Error de conexion MySQL** — Verifica que `DB_PASSWORD` en `backend/.env` coincida con la contraseña de tu MySQL y que la base de datos `gymfit360_db` exista.

**Redireccion al login al iniciar sesion** — Asegurate de que el navegador acepte cookies para `localhost`. El token JWT se guarda en localStorage y cookie automaticamente al iniciar sesion.

**Componente shadcn/ui faltante** — Si una pagina falla por un componente UI que no existe, instala los componentes:

```bash
cd frontend
npx shadcn@latest add button input card label sonner table dialog select badge textarea --yes
```

**Rate limiting (429 Too Many Requests)** — El backend aplica limites de peticiones. Si los alcanzas, espera o reinicia el servidor.

**Error ERR_ERL_KEY_GEN_IPV6** — Asegurate de que express-rate-limit use `req.ipKeyGenerator()` en los keyGenerators personalizados.

**Credenciales de prueba no funcionan** — Si ejecutaste `database/schema.sql` y `database/seeds.sql` pero el login retorna `"Credenciales invalidas"`, vuelve a ejecutar los seeds para asegurar que tienes la version mas reciente con los hashes corregidos:

```bash
mysql -u root -p gymfit360_db < database/seeds.sql
```

**Error "Cuenta no verificada" con usuarios semilla** — Los usuarios de `seeds.sql` ya tienen `verificado = 1`. Si ves este error, es probable que tengas una version antigua del archivo. Re-ejecuta los seeds.

**Error "Entrenador inactivo" al crear plan** — El sistema ahora valida que el entrenador este activo antes de asignar un plan de entrenamiento (regla RN-04). Si ves HTTP 400, verifica que el entrenador seleccionado tenga `activo = 1`.

---

## Correcciones recientes

### v1.1.0 — Junio 2026

Correcciones basadas en el informe de QA (`Docs/informe_qa_GymFit360.md`):

| ID    | Descripcion                                                                 | Archivo(s) afectado(s)                    |
|-------|-----------------------------------------------------------------------------|-------------------------------------------|
| BUG-001 | Implementado endpoint `GET /api/reportes/clases-mas-inscritos` (RF-11)  | `backend/src/modules/reportes/reportes.routes.js` |
| BUG-002 | Validacion de entrenador activo al crear plan (RN-04). Retorna 400 si `activo=0` | `backend/src/modules/planes/planes.routes.js` |
| BUG-003 | Corregido filtro `?estado=todos` que generaba duplicados en listado de afiliados | `backend/src/modules/afiliados/afiliados.routes.js` |
| BUG-004 | Corregidos hashes bcrypt, email de recepcionista y columna `verificado` en `seeds.sql` | `database/seeds.sql` |

**Resultado del QA:** 30/32 casos aprobados (93.75%) → 32/32 (100%) con estas correcciones.
