-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE conductores_db;

-- Conectar a la base de datos
-- \c conductores_db;

-- =====================================================
-- EXTENSIÓN PARA UUID (opcional pero recomendado)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: usuarios
-- Almacena credenciales de usuarios administrativos
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Almacenar hash, NUNCA texto plano
    email VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'supervisor', 'viewer')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLA: empresas
-- Catálogo de empresas disponibles
-- =====================================================
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    prefijo VARCHAR(10) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: conductores
-- Catálogo de conductores registrados
-- =====================================================
CREATE TABLE IF NOT EXISTS conductores (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    empresa VARCHAR(100) REFERENCES empresas(nombre),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para conductores
CREATE INDEX IF NOT EXISTS idx_conductores_nombre ON conductores(nombre);
CREATE INDEX IF NOT EXISTS idx_conductores_empresa ON conductores(empresa);
CREATE INDEX IF NOT EXISTS idx_conductores_activo ON conductores(activo);

-- =====================================================
-- TABLA: formulario
-- Registro principal de información de conductores
-- =====================================================
CREATE TABLE IF NOT EXISTS formulario (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    fecha DATE NOT NULL,
    empresa VARCHAR(100) NOT NULL,
    prefijo VARCHAR(10) NOT NULL,
    vehiculo VARCHAR(50) NOT NULL,
    tabla VARCHAR(50) NOT NULL,
    conductor VARCHAR(100) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    servicio VARCHAR(200) NOT NULL,
    novedad TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id),
    
    -- Índices para búsquedas frecuentes
    CONSTRAINT chk_horas CHECK (hora_fin >= hora_inicio)
);

-- =====================================================
-- ÍNDICES para optimizar consultas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_formulario_fecha ON formulario(fecha);
CREATE INDEX IF NOT EXISTS idx_formulario_empresa ON formulario(empresa);
CREATE INDEX IF NOT EXISTS idx_formulario_conductor ON formulario(conductor);
CREATE INDEX IF NOT EXISTS idx_formulario_vehiculo ON formulario(vehiculo);
CREATE INDEX IF NOT EXISTS idx_formulario_fecha_empresa ON formulario(fecha, empresa);

-- =====================================================
-- DATOS INICIALES: Empresas
-- =====================================================
INSERT INTO empresas (nombre, prefijo) VALUES
    ('Urbanos Cañarte', 'UC'),
    ('Transperla del Otún', 'TP'),
    ('Servilujo', 'SL')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- FUNCIÓN: Actualizar fecha_actualizacion automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-actualizar fecha en formulario
-- =====================================================
DROP TRIGGER IF EXISTS trigger_actualizar_fecha ON formulario;
CREATE TRIGGER trigger_actualizar_fecha
    BEFORE UPDATE ON formulario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- VISTAS útiles para reportes
-- =====================================================

-- Vista: Resumen por empresa
CREATE OR REPLACE VIEW vista_resumen_empresa AS
SELECT 
    empresa,
    prefijo,
    COUNT(*) as total_registros,
    COUNT(DISTINCT conductor) as total_conductores,
    COUNT(DISTINCT vehiculo) as total_vehiculos,
    MIN(fecha) as primera_fecha,
    MAX(fecha) as ultima_fecha
FROM formulario
GROUP BY empresa, prefijo
ORDER BY total_registros DESC;

-- Vista: Registros con novedades
CREATE OR REPLACE VIEW vista_novedades AS
SELECT 
    id,
    fecha,
    empresa,
    conductor,
    vehiculo,
    novedad,
    fecha_creacion
FROM formulario
WHERE novedad IS NOT NULL AND TRIM(novedad) != ''
ORDER BY fecha_creacion DESC;


