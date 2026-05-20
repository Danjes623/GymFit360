# 🏋️ GymFit360

Sistema de gestión integral para gimnasios construido con **Next.js 16**, **Express 5** y **MySQL 8**.

## Módulos implementados

| Módulo | Backend | Frontend |
|--------|---------|----------|
| Autenticación (login, registro, JWT) | ✅ | ✅ |
| Afiliados (CRUD + filtro por membresía) | ✅ | ✅ |
| Entrenadores (CRUD + baja lógica) | ✅ | ✅ |
| Tipos de Membresía (catálogo de planes) | ✅ | ✅ |
| Membresías (asignación + renovación automática) | ✅ | ✅ |
| Pagos (registro por membresía) | ✅ | ✅ |
| Clases grupales (CRUD + inscripciones) | ✅ | ✅ |
| Planes de entrenamiento (asignación personalizada) | ✅ | ✅ |
| Reportes (resumen, ingresos, distribución) | ✅ | ✅ |

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16.2.6, React 19, shadcn/ui v4, React Query, Axios, Zod, react-hook-form |
| **Backend** | Express 5, mysql2, JWT, bcryptjs, helmet, cors, express-validator, express-rate-limit |
| **Base de datos** | MySQL 8.0.13+, InnoDB, utf8mb4 |
| **Lenguaje** | TypeScript (frontend), JavaScript CommonJS (backend) |
| **Autenticación** | JWT con expiración de 8h, contraseñas hasheadas con bcrypt |

## Inicio rápido

```bash
# 1. Crear BD y ejecutar database/schema.sql + database/seeds.sql en MySQL

# 2. Backend
cd backend
npm install
cp .env.example .env   # Editar con tus credenciales MySQL
npm run dev

# 3. Frontend (otra terminal)
cd frontend
npm install
# Crear .env.local con: NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev
```

Abrir **http://localhost:3000**

### Usuarios de prueba (con seeds.sql)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@gymfit360.com | Admin2024! |
| Recepcionista | recepcionista@gymfit360.com | Admin2024! |

> Para instalación detallada, ver [`INSTALLATION.md`](./INSTALLATION.md).

## Estructura del proyecto

```
gymfit360/
├── backend/              # API REST
│   └── src/
│       ├── modules/      # auth, afiliados, entrenadores, membresias, etc.
│       ├── middlewares/   # auth JWT, validate
│       ├── config/       # db.js
│       └── routes/
├── frontend/             # App Next.js 16
│   └── app/
│       ├── (auth)/       # login, register
│       └── (dashboard)/  # afiliados, entrenadores, membresias, clases, etc.
├── database/             # schema.sql, seeds.sql
├── INSTALLATION.md
└── README.md
```

## Características

- ✅ Validación en 3 capas: DB (CHECK, UNIQUE, FK) → Backend (express-validator) → Frontend (Zod)
- ✅ Autenticación JWT stateless con rate limiting
- ✅ CRUD completo de todos los módulos
- ✅ Dashboard con resumen de métricas
- ✅ Reportes de ingresos, distribución y pagos recientes
- ✅ Protección de rutas con proxy de Next.js 16
- ✅ Interfaz responsive con sidebar adaptable
- ✅ Verificación de dependencias antes de eliminar registros
