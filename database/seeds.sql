-- =====================================================
-- SEED DATA
-- =====================================================

-- Limpiar tablas)
TRUNCATE registros RESTART IDENTITY CASCADE;
TRUNCATE conductores RESTART IDENTITY CASCADE;
TRUNCATE tipo_novedades RESTART IDENTITY CASCADE;
TRUNCATE rutas RESTART IDENTITY CASCADE;
TRUNCATE empresas RESTART IDENTITY CASCADE;
TRUNCATE usuarios RESTART IDENTITY CASCADE;

-- =====================================================
-- USUARIOS
-- =====================================================
INSERT INTO usuarios (username, password, nombre, email, activo)
VALUES
('admin', '$2b$10$Vwc3wyEo0kvxrXvA1Ft6euZfdGbTrXsybxyspWObu6nptTeTaUwRW', 'Administrador', 'admin@test.com', true)

-- =====================================================
-- EMPRESAS
-- =====================================================
INSERT INTO empresas (nombre, prefijo)
VALUES
('Urbanos Cañarte', 'UC'),
('Transperla del Otún', 'TP');

-- =====================================================
-- RUTAS
-- =====================================================
INSERT INTO rutas (nombre, numero, descripcion, origen, destino)
VALUES
('Ruta Centro', '101', 'Recorrido por el centro', 'Terminal', 'Centro'),
('Ruta Norte', '102', 'Servicio hacia el norte', 'Terminal', 'Norte'),
('Ruta Sur', '103', 'Servicio hacia el sur', 'Terminal', 'Sur');

-- =====================================================
-- TIPOS DE NOVEDADES
-- =====================================================
INSERT INTO tipo_novedades (nombre, descripcion, severidad, color)
VALUES
('Sin novedad', 'Operación normal', 'baja', '#10b981'),
('Retraso', 'Retraso en el itinerario', 'media', '#f59e0b'),
('Falla mecánica', 'Vehículo requiere revisión', 'alta', '#ef4444'),
('Accidente', 'Evento crítico en vía', 'critica', '#7c2d12');

-- =====================================================
-- CONDUCTORES
-- =====================================================
INSERT INTO conductores (nombre, cedula, telefono)
VALUES
('Carlos Pérez', '10000001', '3001111111'),
('Luis Gómez', '10000002', '3002222222'),
('Andrés Martínez', '10000003', '3003333333');

-- =====================================================
-- REGISTROS
-- =====================================================
INSERT INTO registros (
    fecha,
    empresa_id,
    ruta_id,
    conductor_id,
    vehiculo,
    tabla,
    hora_inicio,
    hora_fin,
    servicio,
    tipo_novedad_id,
    observaciones,
    creado_por
)
VALUES
('2026-02-01', 1, 1, 1, 'BUS-001', 'T01', '06:00', '14:00', 'Servicio urbano', 1, 'Todo en orden', 1),
('2026-02-01', 1, 2, 2, 'BUS-002', 'T02', '07:00', '15:00', 'Servicio urbano', 2, 'Tráfico pesado', 1),
('2026-02-01', 2, 3, 3, 'BUS-010', 'T10', '08:00', '16:00', 'Servicio intermunicipal', 3, 'Se cambia vehículo', 2);
