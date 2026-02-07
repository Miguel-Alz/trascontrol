-- =====================================================
-- SEEDS - Datos de prueba para desarrollo
-- Sistema de Registro de Conductores
-- =====================================================

-- Limpiar datos existentes (CUIDADO: solo usar en desarrollo)
-- TRUNCATE TABLE formulario, conductores, empresas, usuarios RESTART IDENTITY CASCADE;

-- =====================================================
-- Insertar usuario administrador de prueba
-- Contraseña: admin123 (hash bcrypt)
-- =====================================================
INSERT INTO usuarios (username, password, email, rol) 
VALUES (
  'admin', 
  '$2a$10$rOzJqQZQGqQ8qOLPgVMOWOQn3qZQlQsQQlQsQQlQsQQlQsQQlQsQQ', -- admin123
  'admin@transcontrol.com',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- Insertar empresas
-- =====================================================
INSERT INTO empresas (nombre, prefijo, activa) VALUES
  ('Urbanos Cañarte', 'UC', true),
  ('Transperla del Otún', 'TP', true),
  ('Servilujo', 'SL', true)
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- Insertar conductores de prueba
-- =====================================================
INSERT INTO conductores (nombre, cedula, telefono, empresa, activo) VALUES
  ('Juan Carlos Pérez', '1234567890', '3001234567', 'Urbanos Cañarte', true),
  ('María Elena Gómez', '0987654321', '3009876543', 'Urbanos Cañarte', true),
  ('Pedro Antonio López', '1122334455', '3112233445', 'Transperla del Otún', true),
  ('Ana María Rodríguez', '5544332211', '3155443322', 'Transperla del Otún', true),
  ('Carlos Andrés Martínez', '6677889900', '3166778899', 'Servilujo', true),
  ('Laura Patricia Sánchez', '9988776655', '3199887766', 'Servilujo', true)
ON CONFLICT (cedula) DO NOTHING;

-- =====================================================
-- Insertar registros de ejemplo
-- =====================================================
INSERT INTO formulario (fecha, empresa, prefijo, vehiculo, tabla, conductor, hora_inicio, hora_fin, servicio, novedad) VALUES
  (CURRENT_DATE, 'Urbanos Cañarte', 'UC', 'UC-001', 'T-101', 'Juan Carlos Pérez', '06:00', '14:00', 'Ruta Centro - Kennedy', NULL),
  (CURRENT_DATE, 'Urbanos Cañarte', 'UC', 'UC-002', 'T-102', 'María Elena Gómez', '07:00', '15:00', 'Ruta Dosquebradas - Centro', 'Tráfico pesado en la carrera 8'),
  (CURRENT_DATE, 'Transperla del Otún', 'TP', 'TP-010', 'T-201', 'Pedro Antonio López', '05:30', '13:30', 'Ruta Cuba - Centro', NULL),
  (CURRENT_DATE - 1, 'Servilujo', 'SL', 'SL-005', 'T-301', 'Carlos Andrés Martínez', '08:00', '16:00', 'Servicio especial empresarial', NULL),
  (CURRENT_DATE - 1, 'Urbanos Cañarte', 'UC', 'UC-003', 'T-103', 'Juan Carlos Pérez', '14:00', '22:00', 'Ruta Centro - Cuba', 'Vehículo presentó falla menor');

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Seeds insertados correctamente';
  RAISE NOTICE 'Usuario admin creado: admin / admin123';
END $$;
