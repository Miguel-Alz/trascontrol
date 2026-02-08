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
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: rutas
-- Catálogo de rutas de transporte
-- =====================================================
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    numero VARCHAR(20),
    descripcion TEXT,
    origen VARCHAR(100),
    destino VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conductores_nombre ON conductores(nombre);
CREATE INDEX IF NOT EXISTS idx_conductores_cedula ON conductores(cedula);
CREATE INDEX IF NOT EXISTS idx_conductores_activo ON conductores(activo);

-- =====================================================
-- TABLA: registros
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
    tabla VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    servicio varchar(100),
    tipo_novedad_id INTEGER REFERENCES tipo_novedades(id),
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_empresa ON registros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_registros_conductor ON registros(conductor_id);
CREATE INDEX IF NOT EXISTS idx_registros_ruta ON registros(ruta_id);
CREATE INDEX IF NOT EXISTS idx_registros_novedad ON registros(tipo_novedad_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha_empresa ON registros(fecha, empresa_id);



