-- ============================================================
-- GymFit360 — Esquema de Base de Datos MySQL 8+
-- ============================================================
-- Ejecutar en MySQL Workbench:
--   1. CREATE DATABASE gymfit360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
--   2. USE gymfit360_db;
--   3. Ejecutar este script
-- ============================================================

SET NAMES utf8mb4;

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
-- Gestiona el acceso al sistema. Desacoplada de afiliados y entrenadores.
-- ============================================================
CREATE TABLE usuarios (
    id              INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt, nunca texto plano',
    rol             VARCHAR(20)     NOT NULL DEFAULT 'admin',
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('admin', 'recepcionista'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Usuarios con acceso al sistema GymFit360';

-- ============================================================
-- TABLA 2: tipos_membresia
-- Catálogo de planes disponibles en el gimnasio.
-- ============================================================
CREATE TABLE tipos_membresia (
    id              INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    duracion_dias   INT             NOT NULL,
    precio          DECIMAL(10,2)   NOT NULL,
    descripcion     TEXT,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_tm_nombre UNIQUE (nombre),
    CONSTRAINT chk_tm_duracion CHECK (duracion_dias > 0),
    CONSTRAINT chk_tm_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Catálogo de planes de membresía disponibles';

-- ============================================================
-- TABLA 3: entrenadores
-- Personal del gimnasio. Baja lógica con campo activo.
-- ============================================================
CREATE TABLE entrenadores (
    id              INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    telefono        VARCHAR(20),
    especialidad    VARCHAR(200)    NOT NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 = inactivo, no puede asignarse a clases ni planes',
    fecha_ingreso   DATE            NOT NULL DEFAULT (CURRENT_DATE),
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_entrenadores_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Personal entrenador del gimnasio';

-- ============================================================
-- TABLA 4: afiliados
-- Miembros del gimnasio. Entidad central del sistema.
-- ============================================================
CREATE TABLE afiliados (
    id                  INT             NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(100)    NOT NULL,
    email               VARCHAR(150)    NOT NULL,
    telefono            VARCHAR(20),
    documento           VARCHAR(30)     NOT NULL,
    fecha_nacimiento    DATE,
    fecha_ingreso       DATE            NOT NULL DEFAULT (CURRENT_DATE),
    direccion           VARCHAR(255),
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_afiliados_email UNIQUE (email),
    CONSTRAINT uq_afiliados_documento UNIQUE (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Miembros registrados del gimnasio';

-- ============================================================
-- TABLA 5: membresias
-- Registro de membresías asignadas a cada afiliado.
-- Un afiliado puede tener historial de varias, pero solo una activa a la vez.
-- ============================================================
CREATE TABLE membresias (
    id                  INT             NOT NULL AUTO_INCREMENT,
    afiliado_id         INT             NOT NULL,
    tipo_membresia_id   INT             NOT NULL,
    fecha_inicio        DATE            NOT NULL,
    fecha_fin           DATE            NOT NULL,
    activa              TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1 = vigente. Al renovar, desactivar la anterior.',
    observaciones       TEXT,
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_membresias_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_membresias_tipo FOREIGN KEY (tipo_membresia_id) REFERENCES tipos_membresia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_membresias_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Historial de membresías por afiliado';

-- ============================================================
-- TABLA 6: pagos
-- Historial de pagos realizados por cada membresía.
-- ============================================================
CREATE TABLE pagos (
    id              INT             NOT NULL AUTO_INCREMENT,
    membresia_id    INT             NOT NULL,
    afiliado_id     INT             NOT NULL COMMENT 'Desnormalizado para consultas rápidas',
    monto           DECIMAL(10,2)   NOT NULL,
    fecha_pago      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago     VARCHAR(50)     NOT NULL DEFAULT 'efectivo',
    referencia      VARCHAR(100),
    observaciones   TEXT,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pagos_membresia FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pagos_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pagos_monto CHECK (monto > 0),
    CONSTRAINT chk_pagos_metodo CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Historial de pagos de membresías';

-- ============================================================
-- TABLA 7: clases
-- Clases grupales ofrecidas por el gimnasio.
-- ============================================================
CREATE TABLE clases (
    id                  INT             NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(100)    NOT NULL,
    descripcion         TEXT,
    entrenador_id       INT             NOT NULL,
    horario             DATETIME        NOT NULL,
    duracion_minutos    INT             NOT NULL DEFAULT 60,
    cupo_maximo         INT             NOT NULL,
    activa              TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_clases_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_clases_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT chk_clases_cupo CHECK (cupo_maximo > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Clases grupales del gimnasio';

-- ============================================================
-- TABLA 8: inscripciones_clases
-- Tabla intermedia N:M entre afiliados y clases.
-- ============================================================
CREATE TABLE inscripciones_clases (
    id                  INT             NOT NULL AUTO_INCREMENT,
    afiliado_id         INT             NOT NULL,
    clase_id            INT             NOT NULL,
    fecha_inscripcion   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'activa',
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_inscripciones_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscripciones_clase FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_afiliado_clase UNIQUE (afiliado_id, clase_id),
    CONSTRAINT chk_inscripciones_estado CHECK (estado IN ('activa', 'cancelada', 'asistio'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tabla intermedia N:M entre afiliados y clases grupales';

-- ============================================================
-- TABLA 9: planes_entrenamiento
-- Planes personalizados asignados por un entrenador a un afiliado.
-- ============================================================
CREATE TABLE planes_entrenamiento (
    id              INT             NOT NULL AUTO_INCREMENT,
    afiliado_id     INT             NOT NULL,
    entrenador_id   INT             NOT NULL,
    nombre          VARCHAR(150)    NOT NULL,
    descripcion     TEXT            NOT NULL,
    objetivo        VARCHAR(200),
    fecha_inicio    DATE            NOT NULL,
    fecha_fin       DATE,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_planes_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_planes_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_planes_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Planes de entrenamiento personalizados';

-- ============================================================
-- ÍNDICES para mejorar rendimiento en consultas frecuentes
-- ============================================================

-- Consultas de membresías activas por afiliado
CREATE INDEX idx_membresias_afiliado ON membresias(afiliado_id);
CREATE INDEX idx_membresias_activa ON membresias(activa, fecha_fin);

-- Consultas de pagos por afiliado
CREATE INDEX idx_pagos_afiliado ON pagos(afiliado_id);
CREATE INDEX idx_pagos_membresia ON pagos(membresia_id);

-- Búsquedas de inscripciones
CREATE INDEX idx_inscripciones_afiliado ON inscripciones_clases(afiliado_id);
CREATE INDEX idx_inscripciones_clase ON inscripciones_clases(clase_id);

-- Filtro de entrenadores activos
CREATE INDEX idx_entrenadores_activo ON entrenadores(activo);

-- Clases por entrenador y horario
CREATE INDEX idx_clases_entrenador ON clases(entrenador_id);
CREATE INDEX idx_clases_horario ON clases(horario);

-- Planes por afiliado y entrenador
CREATE INDEX idx_planes_afiliado ON planes_entrenamiento(afiliado_id);
CREATE INDEX idx_planes_entrenador ON planes_entrenamiento(entrenador_id);
