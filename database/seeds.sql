-- ============================================================
-- GymFit360 — Datos de prueba (seeds)
-- IMPORTANTE: Ejecutar DESPUÉS de schema.sql
-- Las contraseñas ya están hasheadas con bcrypt (cost 10)
-- Contraseña real para todos los usuarios: Admin2024!
-- ============================================================

-- ============================================================
-- USUARIOS DEL SISTEMA
-- Primero se insertan SIN admin_id para no violar la FK auto-referenciada.
-- Luego se actualiza admin_id una vez todos los registros existen.
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador Principal', 'admin@gymfit360.com',
 '$2b$10$X9Qk8Wj3mN2pL5vH1cRuOeYtZdIaFgBsCxEwVqJrKlMnPoTuWyA6',
 'admin'),
('Recepcionista Ana García', 'recepcion@gymfit360.com',
 '$2b$10$X9Qk8Wj3mN2pL5vH1cRuOeYtZdIaFgBsCxEwVqJrKlMnPoTuWyA6',
 'recepcionista'),
('Juan Pablo Ramírez', 'jp.ramirez@email.com',
 '$2b$10$X9Qk8Wj3mN2pL5vH1cRuOeYtZdIaFgBsCxEwVqJrKlMnPoTuWyA6',
 'usuario');

-- Asignar admin_id (self-reference: el admin es su propio tenant)
-- Desactivar modo seguro para UPDATE sin KEY en WHERE
SET SQL_SAFE_UPDATES = 0;
UPDATE usuarios SET admin_id = id WHERE rol = 'admin';
UPDATE usuarios SET admin_id = 1 WHERE admin_id IS NULL;
SET SQL_SAFE_UPDATES = 1;

-- ============================================================
-- CÓDIGOS DE ADMIN (un solo uso)
-- ============================================================
INSERT INTO codigos_admin (codigo) VALUES ('GYM360-ADMIN-2026');

-- ============================================================
-- TIPOS DE MEMBRESÍA
-- ============================================================
INSERT INTO tipos_membresia (admin_id, nombre, duracion_dias, precio, descripcion) VALUES
(1, 'Plan Mensual',      30,  80000.00, 'Acceso completo por 30 días'),
(1, 'Plan Trimestral',   90,  210000.00, 'Acceso completo por 90 días — ahorra 10%'),
(1, 'Plan Semestral',    180, 390000.00, 'Acceso completo por 180 días — ahorra 18%'),
(1, 'Plan Anual',        365, 720000.00, 'Acceso completo por 365 días — ahorra 25%'),
(1, 'Plan Estudiante',   30,  55000.00, 'Acceso completo para estudiantes con carné vigente');

-- ============================================================
-- ENTRENADORES (3 activos, 2 inactivos)
-- ============================================================
INSERT INTO entrenadores (admin_id, nombre, email, telefono, especialidad, activo, fecha_ingreso) VALUES
(1, 'Carlos Herrera',   'c.herrera@gymfit360.com',   '3001234567', 'Crossfit y Funcional',       1,  '2022-01-15'),
(1, 'María González',   'm.gonzalez@gymfit360.com',  '3109876543', 'Yoga y Pilates',              1,  '2022-03-01'),
(1, 'Andrés Morales',   'a.morales@gymfit360.com',   '3207654321', 'Musculación y Powerlifting', 1,  '2021-06-10'),
(1, 'Laura Jiménez',    'l.jimenez@gymfit360.com',   '3151112233', 'Spinning y Cardio',           0, '2020-09-20'),
(1, 'Roberto Castillo', 'r.castillo@gymfit360.com',  '3004445566', 'Natación y Acuaerobic',       0, '2021-11-05');

-- ============================================================
-- AFILIADOS (10 afiliados con distintos estados)
-- ============================================================
INSERT INTO afiliados (admin_id, nombre, email, telefono, documento, fecha_nacimiento, fecha_ingreso, direccion, usuario_id) VALUES
(1, 'Juan Pablo Ramírez',  'jp.ramirez@email.com',   '3101234567', '1098765432', '1990-05-15', '2023-01-10', 'Calle 45 #23-10, Bogotá', 3),
(1, 'Sofía Martínez',      'sofia.m@email.com',      '3209876543', '1087654321', '1995-08-22', '2023-02-14', 'Carrera 7 #80-55, Bogotá', NULL),
(1, 'Diego Fernández',     'diego.f@email.com',      '3057654321', '1076543210', '1988-12-03', '2022-11-20', 'Av. 68 #12-30, Bogotá', NULL),
(1, 'Valentina Cruz',      'vale.cruz@email.com',    '3161112233', '1065432109', '1993-03-18', '2023-04-05', 'Calle 100 #15-20, Bogotá', NULL),
(1, 'Sebastián López',     'seba.lopez@email.com',   '3004445566', '1054321098', '1992-07-25', '2023-01-28', 'Carrera 15 #90-10, Bogotá', NULL),
(1, 'Camila Torres',       'cami.torres@email.com',  '3208887766', '1043210987', '1997-11-10', '2024-06-01', 'Calle 72 #50-30, Bogotá', NULL),
(1, 'Mateo Vargas',        'mateo.v@email.com',      '3009998877', '1032109876', '1991-02-28', '2024-07-15', 'Carrera 30 #25-15, Bogotá', NULL),
(1, 'Isabella Rojas',      'isa.rojas@email.com',    '3157776655', '1021098765', '1994-09-07', '2023-09-10', 'Av. El Dorado #70-20, Bogotá', NULL),
(1, 'Samuel Gómez',        'samuel.g@email.com',     '3056665544', '1010987654', '1989-04-14', '2022-08-22', 'Calle 26 #34-56, Bogotá', NULL),
(1, 'Luciana Pérez',       'luci.perez@email.com',   '3205554433', '1009876543', '1996-06-30', '2024-03-18', 'Carrera 50 #45-70, Bogotá', NULL);

-- ============================================================
-- MEMBRESÍAS (activas, vencidas y próximas a vencer)
-- ============================================================
INSERT INTO membresias (admin_id, afiliado_id, tipo_membresia_id, fecha_inicio, fecha_fin, activa) VALUES
-- Membresías ACTIVAS (normales)
(1, 1, 2, '2025-02-01', '2025-05-02', 1),   -- Juan: Trimestral activa
(1, 2, 1, '2025-04-15', '2025-05-15', 1),   -- Sofía: Mensual activa
(1, 3, 4, '2025-01-01', '2026-01-01', 1),   -- Diego: Anual activa
(1, 6, 1, '2025-04-20', '2025-05-20', 1),   -- Camila: Mensual activa
(1, 7, 3, '2025-01-01', '2025-07-01', 1),   -- Mateo: Semestral activa
-- Membresías PRÓXIMAS A VENCER (dentro de 7 días desde hoy)
(1, 4, 1, CURRENT_DATE - INTERVAL 23 DAY, CURRENT_DATE + INTERVAL 4 DAY, 1),  -- Valentina: vence en 4 días
(1, 5, 1, CURRENT_DATE - INTERVAL 26 DAY, CURRENT_DATE + INTERVAL 2 DAY, 1),  -- Sebastián: vence en 2 días
-- Membresías VENCIDAS
(1, 8, 1, '2025-01-05', '2025-02-05', 0),  -- Isabella: vencida (inactiva)
(1, 9, 2, '2024-10-01', '2024-12-31', 0),  -- Samuel: vencida (inactiva)
(1, 10, 1, '2024-12-01', '2024-12-31', 0); -- Luciana: vencida (inactiva)

-- ============================================================
-- PAGOS DE MEMBRESÍA
-- ============================================================
INSERT INTO pagos (admin_id, membresia_id, afiliado_id, monto, fecha_pago, metodo_pago) VALUES
(1, 1, 1, 210000.00, '2025-02-01 10:30:00', 'tarjeta'),
(1, 2, 2, 80000.00,  '2025-04-15 09:00:00', 'efectivo'),
(1, 3, 3, 720000.00, '2025-01-01 11:00:00', 'transferencia'),
(1, 4, 4, 80000.00,  CURRENT_TIMESTAMP - INTERVAL 23 DAY, 'efectivo'),
(1, 5, 5, 80000.00,  CURRENT_TIMESTAMP - INTERVAL 26 DAY, 'tarjeta'),
(1, 6, 6, 80000.00,  '2025-04-20 14:00:00', 'efectivo'),
(1, 7, 7, 390000.00, '2025-01-01 10:00:00', 'transferencia'),
(1, 8, 8, 80000.00,  '2025-01-05 09:30:00', 'efectivo'),
(1, 9, 9, 210000.00, '2024-10-01 11:00:00', 'tarjeta'),
(1, 10, 10, 80000.00,'2024-12-01 10:00:00', 'efectivo');

-- ============================================================
-- CLASES GRUPALES
-- ============================================================
INSERT INTO clases (admin_id, nombre, descripcion, entrenador_id, horario, duracion_minutos, cupo_maximo) VALUES
(1, 'Crossfit Matutino',   'Entrenamiento funcional de alta intensidad', 1, '2025-05-20 07:00:00', 60, 15),
(1, 'Yoga Relajante',      'Yoga para reducir estrés y mejorar flexibilidad', 2, '2025-05-20 09:00:00', 60, 20),
(1, 'Musculación Avanzada','Entrenamiento con pesas para niveles intermedios y avanzados', 3, '2025-05-21 18:00:00', 90, 12),
(1, 'Yoga para Principiantes', 'Introducción al yoga', 2, '2025-05-22 08:00:00', 60, 15),
(1, 'Crossfit Vespertino', 'Sesión de crossfit por la tarde', 1, '2025-05-21 17:00:00', 60, 10),
(1, 'Fuerza y Potencia',   'Trabajo de fuerza máxima con barras', 3, '2025-05-23 07:30:00', 75, 8);

-- ============================================================
-- INSCRIPCIONES A CLASES
-- Solo afiliados con membresía activa pueden inscribirse
-- Afiliados 1-7 tienen membresía activa (4 y 5 próximas a vencer)
-- Afiliados 8, 9, 10 tienen membresía vencida → NO deben aparecer
-- ============================================================
INSERT INTO inscripciones_clases (admin_id, afiliado_id, clase_id, estado) VALUES
(1, 1, 1, 'activa'),  -- Juan → Crossfit Matutino
(1, 1, 2, 'activa'),  -- Juan → Yoga Relajante
(1, 2, 2, 'activa'),  -- Sofía → Yoga Relajante
(1, 2, 4, 'activa'),  -- Sofía → Yoga Principiantes
(1, 3, 3, 'activa'),  -- Diego → Musculación Avanzada
(1, 3, 5, 'activa'),  -- Diego → Crossfit Vespertino
(1, 4, 4, 'activa'),  -- Valentina → Yoga Principiantes
(1, 5, 1, 'activa'),  -- Sebastián → Crossfit Matutino
(1, 5, 5, 'activa'),  -- Sebastián → Crossfit Vespertino
(1, 6, 2, 'activa'),  -- Camila → Yoga Relajante
(1, 7, 3, 'activa'),  -- Mateo → Musculación Avanzada
(1, 7, 6, 'activa');  -- Mateo → Fuerza y Potencia

-- ============================================================
-- PLANES DE ENTRENAMIENTO
-- Solo entrenadores activos pueden asignarse (IDs 1, 2, 3)
-- ============================================================
INSERT INTO planes_entrenamiento (admin_id, afiliado_id, entrenador_id, nombre, descripcion, objetivo, fecha_inicio, fecha_fin) VALUES
(1, 1, 1, 'Plan Pérdida de Peso - Juan',
 'Semana 1-2: Cardio 30min + Funcional 30min. Semana 3-4: Incremento progresivo de intensidad.',
 'Pérdida de grasa y mejora cardiovascular',
 '2025-02-01', '2025-05-01'),

(1, 3, 3, 'Plan Hipertrofia - Diego',
 'Día 1: Pecho/Tríceps. Día 2: Espalda/Bíceps. Día 3: Pierna. Día 4: Hombro/Core. Progresión de carga semanal.',
 'Ganancia de masa muscular',
 '2025-01-15', '2025-07-15'),

(1, 2, 2, 'Plan Flexibilidad - Sofía',
 'Rutina diaria de 45min: 15min movilidad articular + 20min yoga + 10min meditación.',
 'Mejora de flexibilidad y reducción de estrés',
 '2025-02-14', NULL),

(1, 6, 1, 'Plan Iniciación Funcional - Camila',
 'Adaptación progresiva para principiantes. Movimientos básicos con énfasis en técnica correcta.',
 'Acondicionamiento físico general',
 '2025-04-20', '2025-07-20'),

(1, 7, 3, 'Plan Fuerza - Mateo',
 'Enfoque en levantamientos básicos: sentadilla, peso muerto, press banca y press militar.',
 'Incremento de fuerza máxima',
 '2025-01-01', '2025-06-30');

-- ============================================================
-- PLANES ADMIN (suscripción para registro de administradores)
-- ============================================================
INSERT INTO planes_admin (nombre, duracion_dias, precio, descripcion) VALUES
('Plan Mensual',   30,  50000.00,  'Acceso completo como administrador por 1 mes. Renovación mensual.'),
('Plan Anual',     365, 480000.00, 'Acceso completo como administrador por 1 año. Ahorra 20%.');
