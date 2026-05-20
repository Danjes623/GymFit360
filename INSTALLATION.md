# GymFit360 — Guía de instalación

Sistema de gestión de gimnasio con **Next.js 16** (frontend) y **Express 5** (backend) sobre **MySQL 8**.

---

## Requisitos del sistema

| Herramienta | Versión mínima | Obligatorio |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.x | ✅ Sí |
| [MySQL](https://dev.mysql.com/downloads/installer/) | 8.0.13+ | ✅ Sí |
| [Git](https://git-scm.com/) | Cualquier versión reciente | ✅ Sí |
| npm (incluido con Node.js) | 10.x | ✅ Sí |
| [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) (recomendado) | 8.x | ❌ Opcional |

> **Nota:** Las funciones `DEFAULT (CURRENT_DATE)` para columnas `DATE` requieren MySQL 8.0.13+.

---

## Estructura del proyecto

```
gymfit360/
├── backend/           # API REST con Express 5
│   ├── src/
│   │   ├── app.js           # Punto de entrada
│   │   ├── config/db.js     # Conexión a MySQL
│   │   ├── middlewares/      # auth.js, validate.js
│   │   ├── modules/          # Cada módulo (auth, afiliados, etc.)
│   │   └── routes/index.js  # Montaje de rutas
│   ├── .env                 # Variables de entorno
│   └── package.json
├── frontend/          # App Next.js 16
│   ├── app/                # Rutas y páginas
│   ├── components/ui/      # shadcn/ui con @base-ui/react
│   ├── lib/                # api.ts (Axios), utils.ts
│   ├── proxy.ts            # Middleware de protección de rutas
│   ├── .env.local          # Variables de entorno
│   └── package.json
└── database/
    ├── schema.sql          # Creación de tablas
    └── seeds.sql           # Datos de prueba
```

---

## Paso 1 — Clonar el repositorio

```bash
git clone <url-del-repositorio> gymfit360
cd gymfit360
```

---

## Paso 2 — Configurar la base de datos

### 2.1. Crear la base de datos

Abre **MySQL Workbench** (o terminal) y ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS gymfit360_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

### 2.2. Ejecutar el esquema

Abre el archivo `database/schema.sql` en MySQL Workbench y ejecútalo (o hazlo desde terminal).

### 2.3. Cargar datos de prueba (opcional)

Ejecuta `database/seeds.sql` para poblar la base con datos de demostración:

- **Usuarios de acceso:**
  - Admin: `admin@gymfit360.com` / `Admin2024!`
  - Recepcionista: `recepcionista@gymfit360.com` / `Admin2024!`
- **5 tipos de membresía**, **5 entrenadores**, **10 afiliados**, membresías, clases, pagos, planes.

> Para entorno productivo, omite este paso o reemplázalo con datos reales.

---

## Paso 3 — Configurar el backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env
# En Windows: Copy-Item .env.example .env
```

Edita `.env` con tus credenciales de MySQL:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=gymfit360_db
JWT_SECRET=genera_un_secreto_de_32_caracteres_aqui
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

> **Importante:** Cambia `JWT_SECRET` por una cadena aleatoria segura (mínimo 32 caracteres).

---

## Paso 4 — Configurar el frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo de entorno
# Crea .env.local con:
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Paso 5 — Iniciar el proyecto

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Deberías ver: `GymFit360 API corriendo en puerto 4000`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

---

## Comandos disponibles

### Backend

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia con recarga automática (`node --watch`) |
| `npm start` | Inicia en producción |
| `npm test` | Ejecuta tests |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |

---

## Solución de problemas comunes

### Error: "Access denied for user 'root'@'localhost'"

La contraseña en `.env` no coincide con la de MySQL. Verifica en MySQL Workbench → Users and Privileges.

### Error: "Unknown database 'gymfit360_db'"

No ejecutaste `CREATE DATABASE` (paso 2.1).

### El login redirige de vuelta al login

El token JWT no se encuentra en cookies. Asegúrate de que tu navegador acepte cookies para `localhost`. Si usas un proxy como configuración de Next.js 16 (`proxy.ts`), el token debe estar disponible tanto en `localStorage` como en cookies (el login lo guarda automáticamente en ambos).

### "Module not found: Can't resolve '@/components/ui/...'"

Falta agregar un componente de shadcn/ui. Ejecuta:

```bash
cd frontend
npx shadcn@latest add button input card label sonner table dialog select badge textarea --yes
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16.2.6, React 19, shadcn/ui v4 (@base-ui/react), React Query, Axios, Zod, react-hook-form |
| **Backend** | Express 5, mysql2 (promesas), JWT (jsonwebtoken), bcryptjs, helmet, cors, express-validator, express-rate-limit |
| **Base de datos** | MySQL 8.0.13+, InnoDB, utf8mb4 |
| **Lenguaje** | TypeScript (frontend), JavaScript CommonJS (backend) |
