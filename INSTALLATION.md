# GymFit360 — Guía de instalación

Sistema de gestión de gimnasios con **Next.js 16** (frontend), **Express 5** (backend) y **MySQL 8** (base de datos).

---

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | 20.x |
| MySQL | 8.0.13+ |
| npm | 10.x |

---

## 1. Clonar y preparar

```bash
git clone <url-del-repositorio> gymfit360
cd gymfit360
```

---

## 2. Base de datos

Crea la base de datos y ejecuta el esquema:

```sql
CREATE DATABASE IF NOT EXISTS gymfit360_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

Abre `database/schema.sql` en MySQL Workbench y ejecútalo (o hazlo desde terminal).

### Datos de prueba (opcional)

Ejecuta `database/seeds.sql` para poblar la base con datos demo:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@gymfit360.com | Admin2024! |
| Recepcionista | recepcionista@gymfit360.com | Admin2024! |
| Usuario | jp.ramirez@email.com | Admin2024! |

Incluye: 5 tipos de membresía, 5 entrenadores, 10 afiliados con membresías, pagos, clases, planes de entrenamiento.

> Para producción omite este paso.

---

## 3. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Edita `.env` con tus credenciales:

```
# Obligatorio
DB_PASSWORD=tu_contraseña_mysql
JWT_SECRET=genera_un_secreto_aleatorio_de_32_caracteres

# Opcional (sin SMTP los códigos se muestran en consola)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu.correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

El resto de variables (`PORT`, `CORS_ORIGIN`, `GYM_NOMBRE`, etc.) vienen con valores funcionales por defecto. La carpeta `uploads/` se crea automáticamente al iniciar.

---

## 4. Frontend

```bash
cd frontend
npm install
```

Crea `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 5. Iniciar

### Terminal 1 — Backend (puerto 4000)

```bash
cd backend
npm run dev
```

Salida esperada: `GymFit360 API corriendo en puerto 4000`

### Terminal 2 — Frontend (puerto 3000)

```bash
cd frontend
npm run dev
```

Abre **http://localhost:3000** en el navegador.

---

## Comandos

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con recarga automática (`node --watch`) |
| `npm start` | Producción |
| `npm test` | Ejecutar tests |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |

---

## Solución de problemas

**Error de conexión MySQL** — Verifica que `DB_PASSWORD` en `.env` coincida con la contraseña de tu MySQL.

**Redirección al login al iniciar sesión** — Asegúrate de que el navegador acepte cookies para `localhost`. El token se guarda en localStorage y cookie automáticamente al iniciar sesión.

**Componente shadcn/ui faltante** — Si una página falla por un componente UI que no existe, instálalo:

```bash
cd frontend
npx shadcn@latest add button input card label sonner table dialog select badge textarea --yes
```

**Rate limiting (429 Too Many Requests)** — El backend tiene límites: 100 peticiones cada 15 minutos (global) y 10 por 15 minutos en login. Espera o reinicia el servidor.
