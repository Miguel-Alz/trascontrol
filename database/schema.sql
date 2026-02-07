-- =====================================================
-- TRANSMILENIO CONTROL - Schema de Base de Datos
-- Sistema de Control de Rutas de Transporte
-- =====================================================

-- CREATE DATABASE conductores_db;
-- \c conductores_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    email VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'viewer' CHECK (rol IN ('admin', 'supervisor', 'viewer')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLA: empresas
-- =====================================================
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    prefijo VARCHAR(10) NOT NULL UNIQUE,
    nit VARCHAR(20),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: rutas
-- Catálogo de rutas de transporte
-- =====================================================
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    origen VARCHAR(100),
    destino VARCHAR(100),
    empresa_id INTEGER REFERENCES empresas(id),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rutas_codigo ON rutas(codigo);
CREATE INDEX IF NOT EXISTS idx_rutas_empresa ON rutas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rutas_activo ON rutas(activo);

-- =====================================================
-- TABLA: tipo_novedades
-- Catálogo de tipos de novedades
-- =====================================================
CREATE TABLE IF NOT EXISTS tipo_novedades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    severidad VARCHAR(20) DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
    color VARCHAR(7) DEFAULT '#f59e0b',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tipo_novedades_activo ON tipo_novedades(activo);

-- =====================================================
-- TABLA: conductores
-- =====================================================
CREATE TABLE IF NOT EXISTS conductores (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    licencia VARCHAR(30),
    empresa_id INTEGER REFERENCES empresas(id),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conductores_nombre ON conductores(nombre);
CREATE INDEX IF NOT EXISTS idx_conductores_cedula ON conductores(cedula);
CREATE INDEX IF NOT EXISTS idx_conductores_empresa ON conductores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conductores_activo ON conductores(activo);

-- =====================================================
-- TABLA: registros (antes formulario)
-- Registro principal de control de rutas
-- =====================================================
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    fecha DATE NOT NULL,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id),
    ruta_id INTEGER REFERENCES rutas(id),
    conductor_id INTEGER REFERENCES conductores(id),
    vehiculo VARCHAR(50) NOT NULL,
    placa VARCHAR(10),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo_novedad_id INTEGER REFERENCES tipo_novedades(id),
    novedad_descripcion TEXT,
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_empresa ON registros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_registros_conductor ON registros(conductor_id);
CREATE INDEX IF NOT EXISTS idx_registros_ruta ON registros(ruta_id);
CREATE INDEX IF NOT EXISTS idx_registros_novedad ON registros(tipo_novedad_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha_empresa ON registros(fecha, empresa_id);

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
-- TRIGGER: Auto-actualizar fecha en registros
-- =====================================================
DROP TRIGGER IF EXISTS trigger_actualizar_fecha ON registros;
CREATE TRIGGER trigger_actualizar_fecha
    BEFORE UPDATE ON registros
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- VISTAS útiles para reportes
-- =====================================================

-- Vista: Resumen por empresa
CREATE OR REPLACE VIEW vista_resumen_empresa AS
SELECT 
    e.nombre as empresa,
    e.prefijo,
    COUNT(*) as total_registros,
    COUNT(DISTINCT r.conductor_id) as total_conductores,
    COUNT(DISTINCT r.vehiculo) as total_vehiculos,
    MIN(r.fecha) as primera_fecha,
    MAX(r.fecha) as ultima_fecha
FROM registros r
JOIN empresas e ON r.empresa_id = e.id
GROUP BY e.id, e.nombre, e.prefijo
ORDER BY total_registros DESC;

-- Vista: Registros con novedades
CREATE OR REPLACE VIEW vista_novedades AS
SELECT 
    r.id,
    r.fecha,
    e.nombre as empresa,
    c.nombre as conductor,
    r.vehiculo,
    tn.nombre as novedad,
    r.novedad_descripcion,
    r.fecha_creacion
FROM registros r
JOIN empresas e ON r.empresa_id = e.id
LEFT JOIN conductores c ON r.conductor_id = c.id
LEFT JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id
WHERE r.novedad_descripcion IS NOT NULL AND TRIM(r.novedad_descripcion) != ''
ORDER BY r.fecha_creacion DESC;


