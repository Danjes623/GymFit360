# 🗄️ GymFit360 — Documentación de Base de Datos

> **SGBD:** MySQL 8+  
> **Nombre de la base de datos:** `gymfit360_db`  
> **Encoding:** UTF-8 (utf8mb4)  
> **Diseño:** Modelo Relacional derivado del MER | Arquitectura 3 capas de validación

---

## 📐 Modelo Entidad-Relación (Descripción)

### Entidades y sus relaciones

```
usuarios            → Autenticación al sistema (independiente del dominio)

tipos_membresia ─────────────────────────────────────┐
                                                      │ 1:N
entrenadores ──────────────────────────┐              │
              │ 1:N (clases)           │              │
              │ 1:N (planes)           ▼              ▼
              │                   afiliados ──── membresias
              │                       │    1:N       │ 1:N
              │                       │              ▼
              │                       │           pagos
              │                       │
              │                       │ N:M (tabla intermedia)
              │                       ▼
              └──────────────── inscripciones_clases ────── clases
                                                              │ N:1
                                                         entrenadores

afiliados 1:N planes_entrenamiento N:1 entrenadores
```

### Resumen de Relaciones

| Relación | Tipo | Tablas involucradas |
|---|---|---|
| Un afiliado tiene muchas membresías | 1:N | `afiliados` → `membresias` |
| Un tipo de membresía aplica a muchas membresías | 1:N | `tipos_membresia` → `membresias` |
| Una membresía tiene muchos pagos | 1:N | `membresias` → `pagos` |
| Un entrenador dicta muchas clases | 1:N | `entrenadores` → `clases` |
| Un entrenador tiene muchos planes | 1:N | `entrenadores` → `planes_entrenamiento` |
| Un afiliado tiene muchos planes | 1:N | `afiliados` → `planes_entrenamiento` |
| Afiliados se inscriben en clases | **N:M** | `afiliados` ↔ `clases` (via `inscripciones_clases`) |

---

## 🗂️ Modelo Relacional — Tablas

### Tabla 1: `usuarios`
Gestiona el acceso al sistema. Desacoplada de `afiliados` y `entrenadores` para permitir distintos tipos de acceso.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre completo |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE | Correo para login |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hash bcrypt de la contraseña |
| `rol` | `VARCHAR(20)` | NOT NULL, DEFAULT 'admin' | Rol del usuario: admin / recepcionista |
| `activo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Baja lógica |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de creación |
| `actualizado_en` | `TIMESTAMP` | DEFAULT NOW() | Última actualización |

**Constraints:**
- `CHECK (rol IN ('admin', 'recepcionista'))`

---

### Tabla 2: `tipos_membresia`
Catálogo de planes disponibles en el gimnasio.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `nombre` | `VARCHAR(100)` | NOT NULL, UNIQUE | Ej: Mensual, Trimestral, Anual |
| `duracion_dias` | `INTEGER` | NOT NULL | Duración en días del plan |
| `precio` | `DECIMAL(10,2)` | NOT NULL | Precio del plan |
| `descripcion` | `TEXT` | | Descripción opcional |
| `activo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Permite desactivar planes sin eliminar |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de creación |

**Constraints:**
- `CHECK (duracion_dias > 0)`
- `CHECK (precio > 0)`

---

### Tabla 3: `entrenadores`
Personal del gimnasio. Baja lógica con campo `activo`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre completo |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE | Correo de contacto |
| `telefono` | `VARCHAR(20)` | | Teléfono opcional |
| `especialidad` | `VARCHAR(200)` | NOT NULL | Ej: Crossfit, Yoga, Musculación |
| `activo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | FALSE = entrenador inactivo |
| `fecha_ingreso` | `DATE` | NOT NULL, DEFAULT CURRENT_DATE | Fecha de vinculación |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de registro |
| `actualizado_en` | `TIMESTAMP` | DEFAULT NOW() | Última actualización |

---

### Tabla 4: `afiliados`
Miembros del gimnasio. Entidad central del sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre completo |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE | Correo de contacto |
| `telefono` | `VARCHAR(20)` | | Teléfono de contacto |
| `documento` | `VARCHAR(30)` | NOT NULL, UNIQUE | Cédula o identificación |
| `fecha_nacimiento` | `DATE` | | Fecha de nacimiento |
| `fecha_ingreso` | `DATE` | NOT NULL, DEFAULT CURRENT_DATE | Fecha de afiliación |
| `direccion` | `VARCHAR(255)` | | Dirección de residencia |
| `activo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Baja lógica |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de registro |
| `actualizado_en` | `TIMESTAMP` | DEFAULT NOW() | Última actualización |

**Constraints:**
- `CHECK (fecha_nacimiento < CURRENT_DATE)` — no puede ser fecha futura
- `CHECK (fecha_ingreso <= CURRENT_DATE)` — no puede ser fecha futura

---

### Tabla 5: `membresias`
Registro de membresías asignadas a cada afiliado. Un afiliado puede tener historial de varias membresías, pero solo una activa a la vez.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `afiliado_id` | `INTEGER` | NOT NULL, FK → afiliados(id) | Afiliado propietario |
| `tipo_membresia_id` | `INTEGER` | NOT NULL, FK → tipos_membresia(id) | Tipo de plan contratado |
| `fecha_inicio` | `DATE` | NOT NULL | Inicio de vigencia |
| `fecha_fin` | `DATE` | NOT NULL | Fin de vigencia (calculado) |
| `activa` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Solo una activa por afiliado |
| `observaciones` | `TEXT` | | Notas adicionales |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de registro |

**Constraints:**
- `CHECK (fecha_fin > fecha_inicio)`

**FK Behavior:**
- `afiliado_id`: `ON DELETE RESTRICT` — no eliminar afiliado con membresías
- `tipo_membresia_id`: `ON DELETE RESTRICT` — no eliminar tipo si hay membresías activas

---

### Tabla 6: `pagos`
Historial de pagos realizados por cada membresía.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `membresia_id` | `INTEGER` | NOT NULL, FK → membresias(id) | Membresía a la que aplica |
| `afiliado_id` | `INTEGER` | NOT NULL, FK → afiliados(id) | Afiliado que paga (desnormalizado para consultas rápidas) |
| `monto` | `DECIMAL(10,2)` | NOT NULL | Valor pagado |
| `fecha_pago` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Fecha y hora del pago |
| `metodo_pago` | `VARCHAR(50)` | NOT NULL, DEFAULT 'efectivo' | efectivo / tarjeta / transferencia |
| `referencia` | `VARCHAR(100)` | | Número de referencia o comprobante |
| `observaciones` | `TEXT` | | Notas del pago |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de registro |

**Constraints:**
- `CHECK (monto > 0)` — **regla de negocio crítica: nunca negativo ni cero**
- `CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro'))`

**FK Behavior:**
- `membresia_id`: `ON DELETE RESTRICT` — no eliminar membresía con pagos
- `afiliado_id`: `ON DELETE RESTRICT`

---

### Tabla 7: `clases`
Clases grupales ofrecidas por el gimnasio.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre de la clase |
| `descripcion` | `TEXT` | | Descripción de la clase |
| `entrenador_id` | `INTEGER` | NOT NULL, FK → entrenadores(id) | Entrenador responsable |
| `horario` | `TIMESTAMP` | NOT NULL | Fecha y hora de la clase |
| `duracion_minutos` | `INTEGER` | NOT NULL, DEFAULT 60 | Duración en minutos |
| `cupo_maximo` | `INTEGER` | NOT NULL | Máximo de inscritos permitidos |
| `activa` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Para cancelar clases sin eliminar |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de creación |
| `actualizado_en` | `TIMESTAMP` | DEFAULT NOW() | Última actualización |

**Constraints:**
- `CHECK (cupo_maximo > 0)` — **regla de negocio crítica**
- `CHECK (duracion_minutos > 0)`

**FK Behavior:**
- `entrenador_id`: `ON DELETE RESTRICT` — no eliminar entrenador con clases

---

### Tabla 8: `inscripciones_clases`
**Tabla intermedia N:M** entre `afiliados` y `clases`. Representa la inscripción de un afiliado a una clase grupal.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `afiliado_id` | `INTEGER` | NOT NULL, FK → afiliados(id) | Afiliado inscrito |
| `clase_id` | `INTEGER` | NOT NULL, FK → clases(id) | Clase en la que se inscribe |
| `fecha_inscripcion` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Cuando se realizó la inscripción |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT 'activa' | activa / cancelada / asistio |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de registro |

**Constraints:**
- `UNIQUE (afiliado_id, clase_id)` — **un afiliado no puede inscribirse dos veces en la misma clase**
- `CHECK (estado IN ('activa', 'cancelada', 'asistio'))`

**FK Behavior:**
- `afiliado_id`: `ON DELETE CASCADE` — si se elimina el afiliado, se eliminan sus inscripciones
- `clase_id`: `ON DELETE CASCADE` — si se cancela/elimina la clase, se eliminan sus inscripciones

---

### Tabla 9: `planes_entrenamiento`
Planes personalizados asignados por un entrenador a un afiliado.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `INT AUTO_INCREMENT` | PK | Identificador autoincremental |
| `afiliado_id` | `INTEGER` | NOT NULL, FK → afiliados(id) | Afiliado destinatario |
| `entrenador_id` | `INTEGER` | NOT NULL, FK → entrenadores(id) | Entrenador que asigna el plan |
| `nombre` | `VARCHAR(150)` | NOT NULL | Nombre del plan |
| `descripcion` | `TEXT` | NOT NULL | Detalle del plan de entrenamiento |
| `objetivo` | `VARCHAR(200)` | | Objetivo: pérdida de peso, fuerza, etc. |
| `fecha_inicio` | `DATE` | NOT NULL | Inicio del plan |
| `fecha_fin` | `DATE` | | Fin estimado del plan (opcional) |
| `activo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Plan vigente o histórico |
| `creado_en` | `TIMESTAMP` | DEFAULT NOW() | Fecha de creación |
| `actualizado_en` | `TIMESTAMP` | DEFAULT NOW() | Última actualización |

**Constraints:**
- `CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)`

**FK Behavior:**
- `afiliado_id`: `ON DELETE RESTRICT`
- `entrenador_id`: `ON DELETE RESTRICT` — no eliminar entrenador con planes asignados

---

## 📜 Script SQL — `schema.sql`

```sql
-- ============================================================
-- GymFit360 — Script de creación de base de datos
-- SGBD: MySQL 8+
-- ============================================================

-- Crear la base de datos (ejecutar en MySQL Workbench antes de correr el script)
-- CREATE DATABASE gymfit360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- USE gymfit360_db;

-- Limpiar tablas si existen (orden inverso por FK)
DROP TABLE IF EXISTS inscripciones_clases;
DROP TABLE IF EXISTS planes_entrenamiento;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS membresias;
DROP TABLE IF EXISTS clases;
DROP TABLE IF EXISTS afiliados;
DROP TABLE IF EXISTS entrenadores;
DROP TABLE IF EXISTS tipos_membresia;
DROP TABLE IF EXISTS usuarios;

-- ============================================================
-- TABLA 1: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    rol             VARCHAR(20)   NOT NULL DEFAULT 'admin'
                    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('admin', 'recepcionista')),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Usuarios con acceso al sistema GymFit360
-- Hash bcrypt, nunca texto plano

-- ============================================================
-- TABLA 2: tipos_membresia
-- ============================================================
CREATE TABLE tipos_membresia (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL UNIQUE,
    duracion_dias   INTEGER         NOT NULL
                    CONSTRAINT chk_tm_duracion CHECK (duracion_dias > 0),
    precio          DECIMAL(10,2)   NOT NULL
                    CONSTRAINT chk_tm_precio CHECK (precio > 0),
    descripcion     TEXT,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Catálogo de planes de membresía disponibles

-- ============================================================
-- TABLA 3: entrenadores
-- ============================================================
CREATE TABLE entrenadores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    especialidad    VARCHAR(200)  NOT NULL,
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_ingreso   DATE          NOT NULL DEFAULT CURRENT_DATE,
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Personal entrenador del gimnasio
-- FALSE = inactivo. No puede asignarse a clases ni planes nuevos

-- ============================================================
-- TABLA 4: afiliados
-- ============================================================
CREATE TABLE afiliados (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  NOT NULL UNIQUE,
    telefono            VARCHAR(20),
    documento           VARCHAR(30)   NOT NULL UNIQUE,
    fecha_nacimiento    DATE
                        CONSTRAINT chk_afiliados_nacimiento CHECK (fecha_nacimiento < CURRENT_DATE),
    fecha_ingreso       DATE          NOT NULL DEFAULT CURRENT_DATE
                        CONSTRAINT chk_afiliados_ingreso CHECK (fecha_ingreso <= CURRENT_DATE),
    direccion           VARCHAR(255),
    activo              BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Miembros registrados del gimnasio

-- ============================================================
-- TABLA 5: membresias
-- ============================================================
CREATE TABLE membresias (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    afiliado_id         INTEGER         NOT NULL
                        REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    tipo_membresia_id   INTEGER         NOT NULL
                        REFERENCES tipos_membresia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    fecha_inicio        DATE            NOT NULL,
    fecha_fin           DATE            NOT NULL
                        CONSTRAINT chk_membresias_fechas CHECK (fecha_fin > fecha_inicio),
    activa              BOOLEAN         NOT NULL DEFAULT TRUE,
    observaciones       TEXT,
    creado_en           TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Historial de membresías por afiliado. Solo una activa por afiliado.
-- TRUE = vigente. Al renovar, desactivar la anterior.

-- ============================================================
-- TABLA 6: pagos
-- ============================================================
CREATE TABLE pagos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    membresia_id    INTEGER         NOT NULL
                    REFERENCES membresias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    afiliado_id     INTEGER         NOT NULL
                    REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    monto           DECIMAL(10,2)   NOT NULL
                    CONSTRAINT chk_pagos_monto CHECK (monto > 0),
    fecha_pago      TIMESTAMP       NOT NULL DEFAULT NOW(),
    metodo_pago     VARCHAR(50)     NOT NULL DEFAULT 'efectivo'
                    CONSTRAINT chk_pagos_metodo CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    referencia      VARCHAR(100),
    observaciones   TEXT,
    creado_en       TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Historial de pagos de membresías
-- Siempre > 0. Constraint CHECK aplicado a nivel DB.

-- ============================================================
-- TABLA 7: clases
-- ============================================================
CREATE TABLE clases (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(100)  NOT NULL,
    descripcion         TEXT,
    entrenador_id       INTEGER       NOT NULL
                        REFERENCES entrenadores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    horario             TIMESTAMP     NOT NULL,
    duracion_minutos    INTEGER       NOT NULL DEFAULT 60
                        CONSTRAINT chk_clases_duracion CHECK (duracion_minutos > 0),
    cupo_maximo         INTEGER       NOT NULL
                        CONSTRAINT chk_clases_cupo CHECK (cupo_maximo > 0),
    activa              BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Clases grupales del gimnasio
-- Máximo de inscritos. Validar en lógica de negocio antes de inscribir.

-- ============================================================
-- TABLA 8: inscripciones_clases (TABLA INTERMEDIA N:M)
-- ============================================================
CREATE TABLE inscripciones_clases (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    afiliado_id         INTEGER       NOT NULL
                        REFERENCES afiliados(id) ON DELETE CASCADE ON UPDATE CASCADE,
    clase_id            INTEGER       NOT NULL
                        REFERENCES clases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    fecha_inscripcion   TIMESTAMP     NOT NULL DEFAULT NOW(),
    estado              VARCHAR(20)   NOT NULL DEFAULT 'activa'
                        CONSTRAINT chk_inscripciones_estado CHECK (estado IN ('activa', 'cancelada', 'asistio')),
    creado_en           TIMESTAMP     NOT NULL DEFAULT NOW(),
    -- Un afiliado no puede inscribirse dos veces en la misma clase
    CONSTRAINT uq_afiliado_clase UNIQUE (afiliado_id, clase_id)
);

-- Tabla intermedia N:M entre afiliados y clases grupales
-- Previene inscripción duplicada

-- ============================================================
-- TABLA 9: planes_entrenamiento
-- ============================================================
CREATE TABLE planes_entrenamiento (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    afiliado_id     INTEGER       NOT NULL
                    REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    entrenador_id   INTEGER       NOT NULL
                    REFERENCES entrenadores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    nombre          VARCHAR(150)  NOT NULL,
    descripcion     TEXT          NOT NULL,
    objetivo        VARCHAR(200),
    fecha_inicio    DATE          NOT NULL,
    fecha_fin       DATE
                    CONSTRAINT chk_planes_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Planes de entrenamiento personalizados. Entrenador debe estar activo al asignar.

-- ============================================================
-- ÍNDICES para mejorar rendimiento en consultas frecuentes
-- ============================================================

-- Consultas de membresías activas por afiliado (muy frecuentes)
CREATE INDEX idx_membresias_afiliado       ON membresias(afiliado_id);
CREATE INDEX idx_membresias_activa         ON membresias(activa, fecha_fin);

-- Consultas de pagos por afiliado
CREATE INDEX idx_pagos_afiliado            ON pagos(afiliado_id);
CREATE INDEX idx_pagos_membresia           ON pagos(membresia_id);

-- Búsquedas de inscripciones
CREATE INDEX idx_inscripciones_afiliado    ON inscripciones_clases(afiliado_id);
CREATE INDEX idx_inscripciones_clase       ON inscripciones_clases(clase_id);

-- Filtro de entrenadores activos
CREATE INDEX idx_entrenadores_activo       ON entrenadores(activo);

-- Clases por entrenador y horario
CREATE INDEX idx_clases_entrenador         ON clases(entrenador_id);
CREATE INDEX idx_clases_horario            ON clases(horario);

-- Planes por afiliado
CREATE INDEX idx_planes_afiliado           ON planes_entrenamiento(afiliado_id);
CREATE INDEX idx_planes_entrenador         ON planes_entrenamiento(entrenador_id);
```

---

## 🌱 Script SQL — `seeds.sql`

```sql
-- ============================================================
-- GymFit360 — Datos de prueba (seeds)
-- IMPORTANTE: Ejecutar DESPUÉS de schema.sql
-- Las contraseñas ya están hasheadas con bcrypt (cost 10)
-- Contraseña real para todos los usuarios: Admin2024!
-- ============================================================

-- ============================================================
-- USUARIOS DEL SISTEMA
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador Principal', 'admin@gymfit360.com',
 '$2b$10$X9Qk8Wj3mN2pL5vH1cRuOeYtZdIaFgBsCxEwVqJrKlMnPoTuWyA6',
 'admin'),
('Recepcionista Ana García', 'recepcion@gymfit360.com',
 '$2b$10$X9Qk8Wj3mN2pL5vH1cRuOeYtZdIaFgBsCxEwVqJrKlMnPoTuWyA6',
 'recepcionista');

-- ============================================================
-- TIPOS DE MEMBRESÍA
-- ============================================================
INSERT INTO tipos_membresia (nombre, duracion_dias, precio, descripcion) VALUES
('Plan Mensual',      30,  80000.00, 'Acceso completo por 30 días'),
('Plan Trimestral',   90,  210000.00, 'Acceso completo por 90 días — ahorra 10%'),
('Plan Semestral',    180, 390000.00, 'Acceso completo por 180 días — ahorra 18%'),
('Plan Anual',        365, 720000.00, 'Acceso completo por 365 días — ahorra 25%'),
('Plan Estudiante',   30,  55000.00, 'Acceso completo para estudiantes con carné vigente');

-- ============================================================
-- ENTRENADORES (3 activos, 2 inactivos)
-- ============================================================
INSERT INTO entrenadores (nombre, email, telefono, especialidad, activo, fecha_ingreso) VALUES
('Carlos Herrera',   'c.herrera@gymfit360.com',   '3001234567', 'Crossfit y Funcional',       TRUE,  '2022-01-15'),
('María González',   'm.gonzalez@gymfit360.com',  '3109876543', 'Yoga y Pilates',              TRUE,  '2022-03-01'),
('Andrés Morales',   'a.morales@gymfit360.com',   '3207654321', 'Musculación y Powerlifting', TRUE,  '2021-06-10'),
('Laura Jiménez',    'l.jimenez@gymfit360.com',   '3151112233', 'Spinning y Cardio',           FALSE, '2020-09-20'),
('Roberto Castillo', 'r.castillo@gymfit360.com',  '3004445566', 'Natación y Acuaerobic',       FALSE, '2021-11-05');

-- ============================================================
-- AFILIADOS (10 afiliados con distintos estados)
-- ============================================================
INSERT INTO afiliados (nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion) VALUES
('Juan Pablo Ramírez',  'jp.ramirez@email.com',   '3101234567', '1098765432', '1990-05-15', '2023-01-10', 'Calle 45 #23-10, Bogotá'),
('Sofía Martínez',      'sofia.m@email.com',      '3209876543', '1087654321', '1995-08-22', '2023-02-14', 'Carrera 7 #80-55, Bogotá'),
('Diego Fernández',     'diego.f@email.com',      '3057654321', '1076543210', '1988-12-03', '2022-11-20', 'Av. 68 #12-30, Bogotá'),
('Valentina Cruz',      'vale.cruz@email.com',    '3161112233', '1065432109', '1993-03-18', '2023-04-05', 'Calle 100 #15-20, Bogotá'),
('Sebastián López',     'seba.lopez@email.com',   '3004445566', '1054321098', '1992-07-25', '2023-01-28', 'Carrera 15 #90-10, Bogotá'),
('Camila Torres',       'cami.torres@email.com',  '3208887766', '1043210987', '1997-11-10', '2024-06-01', 'Calle 72 #50-30, Bogotá'),
('Mateo Vargas',        'mateo.v@email.com',      '3009998877', '1032109876', '1991-02-28', '2024-07-15', 'Carrera 30 #25-15, Bogotá'),
('Isabella Rojas',      'isa.rojas@email.com',    '3157776655', '1021098765', '1994-09-07', '2023-09-10', 'Av. El Dorado #70-20, Bogotá'),
('Samuel Gómez',        'samuel.g@email.com',     '3056665544', '1010987654', '1989-04-14', '2022-08-22', 'Calle 26 #34-56, Bogotá'),
('Luciana Pérez',       'luci.perez@email.com',   '3205554433', '1009876543', '1996-06-30', '2024-03-18', 'Carrera 50 #45-70, Bogotá');

-- ============================================================
-- MEMBRESÍAS (activas, vencidas y próximas a vencer)
-- ============================================================
INSERT INTO membresias (afiliado_id, tipo_membresia_id, fecha_inicio, fecha_fin, activa) VALUES
-- Membresías ACTIVAS (normales)
(1, 2, '2025-02-01', '2025-05-02', TRUE),   -- Juan: Trimestral activa
(2, 1, '2025-04-15', '2025-05-15', TRUE),   -- Sofía: Mensual activa
(3, 4, '2025-01-01', '2026-01-01', TRUE),   -- Diego: Anual activa
(6, 1, '2025-04-20', '2025-05-20', TRUE),   -- Camila: Mensual activa
(7, 3, '2025-01-01', '2025-07-01', TRUE),   -- Mateo: Semestral activa
-- Membresías PRÓXIMAS A VENCER (dentro de 7 días desde hoy)
(4, 1, CURRENT_DATE - INTERVAL 23 DAY, CURRENT_DATE + INTERVAL 4 DAY, TRUE),  -- Valentina: vence en 4 días
(5, 1, CURRENT_DATE - INTERVAL 26 DAY, CURRENT_DATE + INTERVAL '2 days', TRUE),  -- Sebastián: vence en 2 días
-- Membresías VENCIDAS
(8, 1, '2025-01-05', '2025-02-05', FALSE),  -- Isabella: vencida (inactiva)
(9, 2, '2024-10-01', '2024-12-31', FALSE),  -- Samuel: vencida (inactiva)
(10, 1, '2024-12-01', '2024-12-31', FALSE); -- Luciana: vencida (inactiva)

-- ============================================================
-- PAGOS DE MEMBRESÍA
-- ============================================================
INSERT INTO pagos (membresia_id, afiliado_id, monto, fecha_pago, metodo_pago) VALUES
(1, 1, 210000.00, '2025-02-01 10:30:00', 'tarjeta'),
(2, 2, 80000.00,  '2025-04-15 09:00:00', 'efectivo'),
(3, 3, 720000.00, '2025-01-01 11:00:00', 'transferencia'),
(4, 4, 80000.00,  CURRENT_TIMESTAMP - INTERVAL 23 DAY, 'efectivo'),
(5, 5, 80000.00,  CURRENT_TIMESTAMP - INTERVAL 26 DAY, 'tarjeta'),
(6, 6, 80000.00,  '2025-04-20 14:00:00', 'efectivo'),
(7, 7, 390000.00, '2025-01-01 10:00:00', 'transferencia'),
(8, 8, 80000.00,  '2025-01-05 09:30:00', 'efectivo'),
(9, 9, 210000.00, '2024-10-01 11:00:00', 'tarjeta'),
(10, 10, 80000.00,'2024-12-01 10:00:00', 'efectivo');

-- ============================================================
-- CLASES GRUPALES
-- ============================================================
INSERT INTO clases (nombre, descripcion, entrenador_id, horario, duracion_minutos, cupo_maximo) VALUES
('Crossfit Matutino',   'Entrenamiento funcional de alta intensidad', 1, '2025-05-20 07:00:00', 60, 15),
('Yoga Relajante',      'Yoga para reducir estrés y mejorar flexibilidad', 2, '2025-05-20 09:00:00', 60, 20),
('Musculación Avanzada','Entrenamiento con pesas para niveles intermedios y avanzados', 3, '2025-05-21 18:00:00', 90, 12),
('Yoga para Principiantes', 'Introducción al yoga', 2, '2025-05-22 08:00:00', 60, 15),
('Crossfit Vespertino', 'Sesión de crossfit por la tarde', 1, '2025-05-21 17:00:00', 60, 10),
('Fuerza y Potencia',   'Trabajo de fuerza máxima con barras', 3, '2025-05-23 07:30:00', 75, 8);

-- ============================================================
-- INSCRIPCIONES A CLASES
-- Solo afiliados con membresía activa pueden inscribirse
-- Afiliados 1-7 tienen membresía activa (4 y 5 próximas a vencer)
-- Afiliados 8, 9, 10 tienen membresía vencida → NO deben aparecer
-- ============================================================
INSERT INTO inscripciones_clases (afiliado_id, clase_id, estado) VALUES
(1, 1, 'activa'),  -- Juan → Crossfit Matutino
(1, 2, 'activa'),  -- Juan → Yoga Relajante
(2, 2, 'activa'),  -- Sofía → Yoga Relajante
(2, 4, 'activa'),  -- Sofía → Yoga Principiantes
(3, 3, 'activa'),  -- Diego → Musculación Avanzada
(3, 5, 'activa'),  -- Diego → Crossfit Vespertino
(4, 4, 'activa'),  -- Valentina → Yoga Principiantes
(5, 1, 'activa'),  -- Sebastián → Crossfit Matutino
(5, 5, 'activa'),  -- Sebastián → Crossfit Vespertino
(6, 2, 'activa'),  -- Camila → Yoga Relajante
(7, 3, 'activa'),  -- Mateo → Musculación Avanzada
(7, 6, 'activa');  -- Mateo → Fuerza y Potencia

-- ============================================================
-- PLANES DE ENTRENAMIENTO
-- Solo entrenadores activos pueden asignarse (IDs 1, 2, 3)
-- ============================================================
INSERT INTO planes_entrenamiento (afiliado_id, entrenador_id, nombre, descripcion, objetivo, fecha_inicio, fecha_fin) VALUES
(1, 1, 'Plan Pérdida de Peso - Juan',
 'Semana 1-2: Cardio 30min + Funcional 30min. Semana 3-4: Incremento progresivo de intensidad.',
 'Pérdida de grasa y mejora cardiovascular',
 '2025-02-01', '2025-05-01'),

(3, 3, 'Plan Hipertrofia - Diego',
 'Día 1: Pecho/Tríceps. Día 2: Espalda/Bíceps. Día 3: Pierna. Día 4: Hombro/Core. Progresión de carga semanal.',
 'Ganancia de masa muscular',
 '2025-01-15', '2025-07-15'),

(2, 2, 'Plan Flexibilidad - Sofía',
 'Rutina diaria de 45min: 15min movilidad articular + 20min yoga + 10min meditación.',
 'Mejora de flexibilidad y reducción de estrés',
 '2025-02-14', NULL),

(6, 1, 'Plan Iniciación Funcional - Camila',
 'Adaptación progresiva para principiantes. Movimientos básicos con énfasis en técnica correcta.',
 'Acondicionamiento físico general',
 '2025-04-20', '2025-07-20'),

(7, 3, 'Plan Fuerza - Mateo',
 'Enfoque en levantamientos básicos: sentadilla, peso muerto, press banca y press militar.',
 'Incremento de fuerza máxima',
 '2025-01-01', '2025-06-30');
```

---

## 🔍 Consultas Útiles para Pruebas

### Ver estado de membresías de todos los afiliados
```sql
SELECT 
    a.nombre                            AS afiliado,
    tm.nombre                           AS tipo_membresia,
    m.fecha_inicio,
    m.fecha_fin,
    (m.fecha_fin - CURRENT_DATE)        AS dias_restantes,
    CASE 
        WHEN m.fecha_fin < CURRENT_DATE                              THEN '🔴 VENCIDA'
        WHEN m.fecha_fin <= CURRENT_DATE + INTERVAL 7 DAY        THEN '🟡 POR VENCER'
        ELSE                                                              '🟢 ACTIVA'
    END                                 AS estado
FROM afiliados a
LEFT JOIN membresias m     ON m.afiliado_id = a.id
LEFT JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
ORDER BY m.fecha_fin;
```

### Clases con ocupación y cupos disponibles
```sql
SELECT 
    c.nombre                                                AS clase,
    e.nombre                                               AS entrenador,
    c.horario,
    c.cupo_maximo,
    COUNT(ic.id)                                           AS inscritos,
    (c.cupo_maximo - COUNT(ic.id))                        AS cupos_disponibles,
    ROUND((COUNT(ic.id)::decimal / c.cupo_maximo) * 100, 1) AS ocupacion_pct
FROM clases c
LEFT JOIN entrenadores e            ON e.id = c.entrenador_id
LEFT JOIN inscripciones_clases ic   ON ic.clase_id = c.id AND ic.estado = 'activa'
GROUP BY c.id, e.nombre
ORDER BY inscritos DESC;
```

### Afiliados con membresía próxima a vencer (7 días)
```sql
SELECT 
    a.nombre,
    a.email,
    a.telefono,
    m.fecha_fin,
    (m.fecha_fin - CURRENT_DATE) AS dias_para_vencer
FROM afiliados a
JOIN membresias m ON m.afiliado_id = a.id AND m.activa = TRUE
WHERE m.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 7 DAY
ORDER BY m.fecha_fin;
```

### Ficha completa de un afiliado (JOIN múltiple)
```sql
SELECT 
    a.nombre                            AS afiliado,
    a.email,
    tm.nombre                           AS tipo_membresia,
    m.fecha_fin                         AS vence,
    c.nombre                            AS clase_inscrita,
    c.horario,
    e.nombre                            AS entrenador_clase
FROM afiliados a
JOIN membresias m                   ON m.afiliado_id = a.id AND m.activa = TRUE
JOIN tipos_membresia tm             ON tm.id = m.tipo_membresia_id
LEFT JOIN inscripciones_clases ic   ON ic.afiliado_id = a.id AND ic.estado = 'activa'
LEFT JOIN clases c                  ON c.id = ic.clase_id
LEFT JOIN entrenadores e            ON e.id = c.entrenador_id
WHERE a.id = 1  -- Cambiar por el ID deseado
ORDER BY c.horario;
```

---

## 🧠 Reglas de Negocio Implementadas a Nivel DB

| Regla | Implementación |
|---|---|
| Monto de pago > 0 | `CHECK (monto > 0)` en tabla `pagos` |
| Cupo de clase > 0 | `CHECK (cupo_maximo > 0)` en tabla `clases` |
| Fechas coherentes en membresía | `CHECK (fecha_fin > fecha_inicio)` |
| Fechas coherentes en planes | `CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)` |
| No inscripción doble | `UNIQUE (afiliado_id, clase_id)` en `inscripciones_clases` |
| Email único por tabla | `UNIQUE` en `email` de `usuarios`, `afiliados`, `entrenadores` |
| Documento único de afiliado | `UNIQUE` en `documento` de `afiliados` |
| Fecha nacimiento no futura | `CHECK (fecha_nacimiento < CURRENT_DATE)` |
| Rol de usuario válido | `CHECK (rol IN ('admin', 'recepcionista'))` |
| Método de pago válido | `CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro'))` |
| Estado de inscripción válido | `CHECK (estado IN ('activa', 'cancelada', 'asistio'))` |

> **Nota:** La validación de cupo en tiempo real, la verificación de membresía activa antes de inscribir y la verificación de entrenador activo antes de asignar plan deben implementarse en la capa de **lógica de negocio del backend** (no solo en DB), ya que requieren consultas adicionales.
