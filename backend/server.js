const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); 

// Conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'conductores_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
});

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui_cambiar_en_produccion';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generar token
        const token = jwt.sign(
            { id: user.id, username: user.username, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol,
                nombre: user.username
            },
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// =====================================================
// CRUD EMPRESAS
// =====================================================

// GET todas las empresas
app.get('/api/empresas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresas WHERE activo = true ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET una empresa por ID
app.get('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM empresas WHERE id = $1 AND activo = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener empresa:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST crear nueva empresa
app.post('/api/empresas', authenticateToken, async (req, res) => {
    try {
        const { nombre, prefijo } = req.body;
        if (!nombre || !prefijo) {
            return res.status(400).json({ success: false, error: 'Nombre y prefijo requeridos' });
        }
        const result = await pool.query(
            'INSERT INTO empresas (nombre, prefijo) VALUES ($1, $2) RETURNING *',
            [nombre, prefijo]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// PUT actualizar empresa
app.put('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, prefijo, activo } = req.body;
        const result = await pool.query(
            'UPDATE empresas SET nombre = COALESCE($1, nombre), prefijo = COALESCE($2, prefijo), activo = COALESCE($3, activo) WHERE id = $4 RETURNING *',
            [nombre, prefijo, activo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// DELETE eliminar empresa
app.delete('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE empresas SET activo = false WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, message: 'Empresa eliminada' });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// =====================================================
// CRUD RUTAS
// =====================================================

// GET todas las rutas
app.get('/api/rutas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rutas WHERE activo = true ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener rutas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET una ruta por ID
app.get('/api/rutas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM rutas WHERE id = $1 AND activo = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener ruta:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST crear nueva ruta
app.post('/api/rutas', authenticateToken, async (req, res) => {
    try {
        const { nombre, descripcion, origen, destino } = req.body;
        if (!nombre) {
            return res.status(400).json({ success: false, error: 'Nombre requerido' });
        }
        const result = await pool.query(
            'INSERT INTO rutas (nombre, descripcion, origen, destino) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, descripcion || null, origen || null, destino || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear ruta:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// PUT actualizar ruta
app.put('/api/rutas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, origen, destino, activo } = req.body;
        const result = await pool.query(
            'UPDATE rutas SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), origen = COALESCE($3, origen), destino = COALESCE($4, destino), activo = COALESCE($5, activo) WHERE id = $6 RETURNING *',
            [nombre, descripcion, origen, destino, activo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar ruta:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// DELETE eliminar ruta
app.delete('/api/rutas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE rutas SET activo = false WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
        }
        res.json({ success: true, message: 'Ruta eliminada' });
    } catch (error) {
        console.error('Error al eliminar ruta:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// =====================================================
// CRUD TIPO_NOVEDADES
// =====================================================

// GET todas las tipos de novedades
app.get('/api/tipo-novedades', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tipo_novedades WHERE activo = true ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener tipos de novedades:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET un tipo de novedad por ID
app.get('/api/tipo-novedades/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tipo_novedades WHERE id = $1 AND activo = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Tipo de novedad no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener tipo de novedad:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST crear nuevo tipo de novedad
app.post('/api/tipo-novedades', authenticateToken, async (req, res) => {
    try {
        const { nombre, descripcion, severidad, color } = req.body;
        if (!nombre) {
            return res.status(400).json({ success: false, error: 'Nombre requerido' });
        }
        const result = await pool.query(
            'INSERT INTO tipo_novedades (nombre, descripcion, severidad, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, descripcion || null, severidad || 'media', color || '#f59e0b']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear tipo de novedad:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// PUT actualizar tipo de novedad
app.put('/api/tipo-novedades/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, severidad, color, activo } = req.body;
        const result = await pool.query(
            'UPDATE tipo_novedades SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), severidad = COALESCE($3, severidad), color = COALESCE($4, color), activo = COALESCE($5, activo) WHERE id = $6 RETURNING *',
            [nombre, descripcion, severidad, color, activo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Tipo de novedad no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar tipo de novedad:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// DELETE eliminar tipo de novedad
app.delete('/api/tipo-novedades/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE tipo_novedades SET activo = false WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Tipo de novedad no encontrado' });
        }
        res.json({ success: true, message: 'Tipo de novedad eliminado' });
    } catch (error) {
        console.error('Error al eliminar tipo de novedad:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// =====================================================
// CRUD CONDUCTORES
// =====================================================

// GET todos los conductores
app.get('/api/conductores', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM conductores WHERE activo = true ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener conductores:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET un conductor por ID
app.get('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM conductores WHERE id = $1 AND activo = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener conductor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST crear nuevo conductor
app.post('/api/conductores', authenticateToken, async (req, res) => {
    try {
        const { nombre, cedula, telefono } = req.body;
        if (!nombre) {
            return res.status(400).json({ success: false, error: 'Nombre requerido' });
        }
        const result = await pool.query(
            'INSERT INTO conductores (nombre, cedula, telefono) VALUES ($1, $2, $3) RETURNING *',
            [nombre, cedula || null, telefono || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear conductor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// PUT actualizar conductor
app.put('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, cedula, telefono, activo } = req.body;
        const result = await pool.query(
            'UPDATE conductores SET nombre = COALESCE($1, nombre), cedula = COALESCE($2, cedula), telefono = COALESCE($3, telefono), activo = COALESCE($4, activo), fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [nombre, cedula, telefono, activo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar conductor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// DELETE eliminar conductor
app.delete('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE conductores SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
        }
        res.json({ success: true, message: 'Conductor eliminado' });
    } catch (error) {
        console.error('Error al eliminar conductor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// =====================================================
// CRUD REGISTROS
// =====================================================

// GET todos los registros
app.get('/api/registros', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM registros ORDER BY fecha DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET un registro por ID
app.get('/api/registros/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM registros WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener registro:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// POST crear nuevo registro
app.post('/api/registros', authenticateToken, async (req, res) => {
    try {
        const { fecha, empresa_id, ruta_id, conductor_id, vehiculo, tabla, hora_inicio, hora_fin, servicio, tipo_novedad_id, observaciones } = req.body;
        
        if (!fecha || !empresa_id || !vehiculo || !tabla || !hora_inicio || !hora_fin) {
            return res.status(400).json({ success: false, error: 'Campos requeridos incompletos' });
        }

        const result = await pool.query(
            'INSERT INTO registros (fecha, empresa_id, ruta_id, conductor_id, vehiculo, tabla, hora_inicio, hora_fin, servicio, tipo_novedad_id, observaciones, creado_por) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [fecha, empresa_id, ruta_id || null, conductor_id || null, vehiculo, tabla, hora_inicio, hora_fin, servicio || null, tipo_novedad_id || null, observaciones || null, req.user.id]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear registro:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// PUT actualizar registro
app.put('/api/registros/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, empresa_id, ruta_id, conductor_id, vehiculo, tabla, hora_inicio, hora_fin, servicio, tipo_novedad_id, observaciones } = req.body;
        
        const result = await pool.query(
            'UPDATE registros SET fecha = COALESCE($1, fecha), empresa_id = COALESCE($2, empresa_id), ruta_id = COALESCE($3, ruta_id), conductor_id = COALESCE($4, conductor_id), vehiculo = COALESCE($5, vehiculo), tabla = COALESCE($6, tabla), hora_inicio = COALESCE($7, hora_inicio), hora_fin = COALESCE($8, hora_fin), servicio = COALESCE($9, servicio), tipo_novedad_id = COALESCE($10, tipo_novedad_id), observaciones = COALESCE($11, observaciones), fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $12 RETURNING *',
            [fecha, empresa_id, ruta_id, conductor_id, vehiculo, tabla, hora_inicio, hora_fin, servicio, tipo_novedad_id, observaciones, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// DELETE eliminar registro
app.delete('/api/registros/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM registros WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }
        res.json({ success: true, message: 'Registro eliminado' });
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de TransControl escuchando en puerto ${PORT}`);
});

module.exports = app;
