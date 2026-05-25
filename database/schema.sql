-- ============================================================
-- GymFit360 -- Esquema de Base de Datos MySQL 8+
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
DROP TABLE IF EXISTS gimnasio_config;
DROP TABLE IF EXISTS codigos_admin;
DROP TABLE IF EXISTS usuarios;

-- ============================================================
-- TABLA 1: usuarios
-- Gestiona el acceso al sistema. Desacoplada de afiliados y entrenadores.
-- admin_id se auto-referencia: para admins = su propio id,
-- para recepcionistas/usuarios = id del admin al que pertenecen.
-- ============================================================
CREATE TABLE usuarios (
    id              INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt, nunca texto plano',
    rol             VARCHAR(20)     NOT NULL DEFAULT 'admin',
    admin_id        INT             NULL COMMENT 'ID del admin/tenant propietario. Self-FK.',
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('admin', 'recepcionista', 'usuario'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Usuarios con acceso al sistema GymFit360';

-- FK auto-referenciada (se agrega después de crear la tabla)
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ============================================================
-- TABLA 1c: gimnasio_config
-- Configuración del gimnasio (logo, nombre, dirección, teléfono)
-- Relación 1:1 con admin. Creada automáticamente al registrar admin.
-- ============================================================
CREATE TABLE gimnasio_config (
    id              INT             NOT NULL AUTO_INCREMENT,
    admin_id        INT             NOT NULL,
    nombre          VARCHAR(100)    NOT NULL DEFAULT 'GymFit360',
    logo            VARCHAR(255)    NOT NULL DEFAULT '/logo.png',
    direccion       VARCHAR(255)    NOT NULL DEFAULT '',
    telefono        VARCHAR(20)     NOT NULL DEFAULT '',
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_gimnasio_config_admin UNIQUE (admin_id),
    CONSTRAINT fk_gimnasio_config_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Configuración del gimnasio por administrador';

-- ============================================================
-- TABLA 1b: codigos_admin
-- Códigos de un solo uso para registrar cuentas de administrador.
-- El dueño del sistema genera estos códigos y los entrega al
-- cliente cuando paga la suscripción del gimnasio.
-- ============================================================
CREATE TABLE codigos_admin (
    id              INT             NOT NULL AUTO_INCREMENT,
    codigo          VARCHAR(50)     NOT NULL,
    usado           TINYINT(1)      NOT NULL DEFAULT 0,
    usado_por       INT             NULL,
    usado_en        DATETIME        NULL,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_codigos_admin_codigo UNIQUE (codigo),
    CONSTRAINT fk_codigos_admin_usado FOREIGN KEY (usado_por) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Códigos de un solo uso para registro de administradores';

-- ============================================================
-- TABLA 2: tipos_membresia
-- Catálogo de planes disponibles en el gimnasio.
-- ============================================================
CREATE TABLE tipos_membresia (
    id              INT             NOT NULL AUTO_INCREMENT,
    admin_id        INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
    nombre          VARCHAR(100)    NOT NULL,
    duracion_dias   INT             NOT NULL,
    precio          DECIMAL(10,2)   NOT NULL,
    descripcion     TEXT,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_tm_nombre UNIQUE (admin_id, nombre),
    CONSTRAINT fk_tm_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_tm_duracion CHECK (duracion_dias > 0),
    CONSTRAINT chk_tm_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Catálogo de planes de membresía disponibles';

-- ============================================================
-- TABLA 3: entrenadores
-- Personal del gimnasio. Baja lógica con campo activo.
-- ============================================================
CREATE TABLE entrenadores (
    id              INT             NOT NULL AUTO_INCREMENT,
    admin_id        INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    telefono        VARCHAR(20),
    especialidad    VARCHAR(200)    NOT NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 = inactivo, no puede asignarse a clases ni planes',
    fecha_ingreso   DATE            NOT NULL DEFAULT (CURRENT_DATE),
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_entrenadores_email UNIQUE (admin_id, email),
    CONSTRAINT fk_entrenadores_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Personal entrenador del gimnasio';

-- ============================================================
-- TABLA 4: afiliados
-- Miembros del gimnasio. Entidad central del sistema.
-- ============================================================
CREATE TABLE afiliados (
    id                  INT             NOT NULL AUTO_INCREMENT,
    admin_id            INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
    nombre              VARCHAR(100)    NOT NULL,
    email               VARCHAR(150)    NOT NULL,
    telefono            VARCHAR(20),
    documento           VARCHAR(30)     NOT NULL,
    fecha_nacimiento    DATE,
    fecha_ingreso       DATE            NOT NULL DEFAULT (CURRENT_DATE),
    direccion           VARCHAR(255),
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    usuario_id          INT             NULL COMMENT 'FK opcional a usuarios. Se vincula cuando un usuario-rol crea/registra su cuenta.',
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_afiliados_email UNIQUE (admin_id, email),
    CONSTRAINT uq_afiliados_documento UNIQUE (admin_id, documento),
    CONSTRAINT fk_afiliados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_afiliados_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Miembros registrados del gimnasio';

-- ============================================================
-- TABLA 5: membresias
-- Registro de membresías asignadas a cada afiliado.
-- Un afiliado puede tener historial de varias, pero solo una activa a la vez.
-- ============================================================
CREATE TABLE membresias (
    id                  INT             NOT NULL AUTO_INCREMENT,
    admin_id            INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
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
    CONSTRAINT fk_membresias_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_membresias_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Historial de membresías por afiliado';

-- ============================================================
-- TABLA 6: pagos
-- Historial de pagos realizados por cada membresía.
-- ============================================================
CREATE TABLE pagos (
    id              INT             NOT NULL AUTO_INCREMENT,
    admin_id        INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
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
    CONSTRAINT fk_pagos_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_pagos_monto CHECK (monto > 0),
    CONSTRAINT chk_pagos_metodo CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Historial de pagos de membresías';

-- ============================================================
-- TABLA 7: clases
-- Clases grupales ofrecidas por el gimnasio.
-- ============================================================
CREATE TABLE clases (
    id                  INT             NOT NULL AUTO_INCREMENT,
    admin_id            INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
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
    CONSTRAINT fk_clases_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_clases_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT chk_clases_cupo CHECK (cupo_maximo > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Clases grupales del gimnasio';

-- ============================================================
-- TABLA 8: inscripciones_clases
-- Tabla intermedia N:M entre afiliados y clases.
-- ============================================================
CREATE TABLE inscripciones_clases (
    id                  INT             NOT NULL AUTO_INCREMENT,
    admin_id            INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
    afiliado_id         INT             NOT NULL,
    clase_id            INT             NOT NULL,
    fecha_inscripcion   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'activa',
    creado_en           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_inscripciones_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscripciones_clase FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscripciones_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT uq_afiliado_clase UNIQUE (afiliado_id, clase_id),
    CONSTRAINT chk_inscripciones_estado CHECK (estado IN ('activa', 'cancelada', 'asistio'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tabla intermedia N:M entre afiliados y clases grupales';

-- ============================================================
-- TABLA 9: planes_entrenamiento
-- Planes personalizados asignados por un entrenador a un afiliado.
-- ============================================================
CREATE TABLE planes_entrenamiento (
    id              INT             NOT NULL AUTO_INCREMENT,
    admin_id        INT             NOT NULL COMMENT 'ID del admin/tenant propietario',
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
    CONSTRAINT fk_planes_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_planes_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Planes de entrenamiento personalizados';

-- ============================================================
-- TABLA 10: planes_admin
-- Planes de suscripción para administradores (registro vía pago).
-- Gestionados por el super-admin del sistema.
-- ============================================================
CREATE TABLE planes_admin (
    id              INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    duracion_dias   INT             NOT NULL COMMENT '30 = mensual, 365 = anual',
    precio          DECIMAL(10,2)   NOT NULL,
    descripcion     TEXT,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_plan_admin_duracion CHECK (duracion_dias > 0),
    CONSTRAINT chk_plan_admin_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Planes de suscripción para registro de administradores';

-- ============================================================
-- TABLA 11: suscripciones_admin
-- Registro de compras de planes_admin.
-- Cuando un usuario "paga" (mock), se genera un código único
-- que se envía por email para completar el registro.
-- ============================================================
CREATE TABLE suscripciones_admin (
    id              INT             NOT NULL AUTO_INCREMENT,
    plan_admin_id   INT             NOT NULL COMMENT 'FK al plan adquirido',
    email           VARCHAR(150)    NOT NULL COMMENT 'Email donde se envía el código',
    nombre          VARCHAR(100)    NOT NULL COMMENT 'Nombre del comprador',
    monto           DECIMAL(10,2)   NOT NULL COMMENT 'Precio pagado (copia del plan al momento de compra)',
    metodo_pago     VARCHAR(50)     NOT NULL DEFAULT 'mock',
    codigo          VARCHAR(50)     NOT NULL,
    pagado          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = pago confirmado',
    codigo_usado    TINYINT(1)      NOT NULL DEFAULT 0,
    usado_por       INT             NULL,
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pagado_en       DATETIME        NULL,
    usado_en        DATETIME        NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_suscripciones_codigo UNIQUE (codigo),
    CONSTRAINT fk_suscripciones_plan FOREIGN KEY (plan_admin_id) REFERENCES planes_admin(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suscripciones_usado FOREIGN KEY (usado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Suscripciones de administradores (pago + código de activación)';
-- ============================================================
-- Si ya tienes datos, ejecuta esto para asignar el tenant #1
-- al admin existente y a todos sus datos:
--
--   UPDATE usuarios SET admin_id = id WHERE rol = 'admin';
--   UPDATE usuarios SET admin_id = 1 WHERE rol IN ('recepcionista', 'usuario') AND admin_id IS NULL;
--   UPDATE afiliados            SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE entrenadores         SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE clases               SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE tipos_membresia      SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE membresias           SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE pagos                SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE inscripciones_clases SET admin_id = 1 WHERE admin_id IS NULL;
--   UPDATE planes_entrenamiento SET admin_id = 1 WHERE admin_id IS NULL;
--
-- Luego agregar FK y columnas faltantes:
--   ALTER TABLE usuarios ADD COLUMN admin_id INT NULL;
--   ALTER TABLE afiliados ADD COLUMN admin_id INT NOT NULL DEFAULT 1;
--   ALTER TABLE entrenadores ADD COLUMN admin_id INT NOT NULL DEFAULT 1;
--   -- etc para cada tabla
-- ============================================================

-- ============================================================
-- ÍNDICES para mejorar rendimiento en consultas frecuentes
-- ============================================================

-- Índices multi-tenant (cada query filtra por admin_id)
CREATE INDEX idx_usuarios_admin ON usuarios(admin_id);
CREATE INDEX idx_afiliados_admin ON afiliados(admin_id);
CREATE INDEX idx_entrenadores_admin ON entrenadores(admin_id);
CREATE INDEX idx_clases_admin ON clases(admin_id);
CREATE INDEX idx_tm_admin ON tipos_membresia(admin_id);
CREATE INDEX idx_membresias_admin ON membresias(admin_id);
CREATE INDEX idx_pagos_admin ON pagos(admin_id);
CREATE INDEX idx_inscripciones_admin ON inscripciones_clases(admin_id);
CREATE INDEX idx_planes_admin ON planes_entrenamiento(admin_id);

-- Índices existentes (consultas frecuentes)
CREATE INDEX idx_membresias_afiliado ON membresias(afiliado_id);
CREATE INDEX idx_membresias_activa ON membresias(activa, fecha_fin);
CREATE INDEX idx_pagos_afiliado ON pagos(afiliado_id);
CREATE INDEX idx_pagos_membresia ON pagos(membresia_id);
CREATE INDEX idx_inscripciones_afiliado ON inscripciones_clases(afiliado_id);
CREATE INDEX idx_inscripciones_clase ON inscripciones_clases(clase_id);
CREATE INDEX idx_entrenadores_activo ON entrenadores(activo);
CREATE INDEX idx_clases_entrenador ON clases(entrenador_id);
CREATE INDEX idx_clases_horario ON clases(horario);
CREATE INDEX idx_planes_afiliado ON planes_entrenamiento(afiliado_id);
CREATE INDEX idx_planes_entrenador ON planes_entrenamiento(entrenador_id);
