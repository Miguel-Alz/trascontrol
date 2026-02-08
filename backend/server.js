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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM empresas';
        let countQuery = 'SELECT COUNT(*) FROM empresas';
        const params = [];
        
        if (search) {
            query += ' WHERE nombre ILIKE $1';
            countQuery += ' WHERE nombre ILIKE $1';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY nombre LIMIT $'+(params.length+1)+' OFFSET $'+(params.length+2);
        params.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);
        
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: { page, limit, total, totalPages }
        });
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET una empresa por ID
app.get('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
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
            'DELETE FROM empresas WHERE id = $1 RETURNING *',
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM rutas';
        let countQuery = 'SELECT COUNT(*) FROM rutas';
        const params = [];
        
        if (search) {
            query += ' WHERE nombre ILIKE $1 OR origen ILIKE $1 OR destino ILIKE $1';
            countQuery += ' WHERE nombre ILIKE $1 OR origen ILIKE $1 OR destino ILIKE $1';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY nombre LIMIT $'+(params.length+1)+' OFFSET $'+(params.length+2);
        params.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);
        
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: { page, limit, total, totalPages }
        });
    } catch (error) {
        console.error('Error al obtener rutas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET una ruta por ID
app.get('/api/rutas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM rutas WHERE id = $1', [id]);
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
        const { nombre, numero, descripcion, origen, destino } = req.body;
        if (!nombre) {
            return res.status(400).json({ success: false, error: 'Nombre requerido' });
        }
        const result = await pool.query(
            'INSERT INTO rutas (nombre, numero, descripcion, origen, destino) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, numero || null, descripcion || null, origen || null, destino || null]
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
        const { nombre, numero, descripcion, origen, destino, activo } = req.body;
        const result = await pool.query(
            'UPDATE rutas SET nombre = COALESCE($1, nombre), numero = COALESCE($2, numero), descripcion = COALESCE($3, descripcion), origen = COALESCE($4, origen), destino = COALESCE($5, destino), activo = COALESCE($6, activo) WHERE id = $7 RETURNING *',
            [nombre, numero, descripcion, origen, destino, activo, id]
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
            'DELETE FROM rutas WHERE id = $1 RETURNING *',
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM tipo_novedades';
        let countQuery = 'SELECT COUNT(*) FROM tipo_novedades';
        const params = [];
        
        if (search) {
            query += ' WHERE nombre ILIKE $1';
            countQuery += ' WHERE nombre ILIKE $1';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY nombre LIMIT $'+(params.length+1)+' OFFSET $'+(params.length+2);
        params.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);
        
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: { page, limit, total, totalPages }
        });
    } catch (error) {
        console.error('Error al obtener tipos de novedades:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET un tipo de novedad por ID
app.get('/api/tipo-novedades/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tipo_novedades WHERE id = $1', [id]);
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
            'DELETE FROM tipo_novedades WHERE id = $1 RETURNING *',
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM conductores';
        let countQuery = 'SELECT COUNT(*) FROM conductores';
        const params = [];
        
        if (search) {
            query += ' WHERE nombre ILIKE $1 OR cedula ILIKE $1';
            countQuery += ' WHERE nombre ILIKE $1 OR cedula ILIKE $1';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY nombre LIMIT $'+(params.length+1)+' OFFSET $'+(params.length+2);
        params.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);
        
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: { page, limit, total, totalPages }
        });
    } catch (error) {
        console.error('Error al obtener conductores:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET un conductor por ID
app.get('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM conductores WHERE id = $1', [id]);
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
            'DELETE FROM conductores WHERE id = $1 RETURNING *',
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { fechaInicio, fechaFin, empresa, vehiculo, tabla, horaInicio, horaFin } = req.query;
        
        let query = `SELECT r.*, e.nombre as empresa_nombre, rt.nombre as ruta_nombre, c.nombre as conductor_nombre, tn.nombre as novedad_nombre
            FROM registros r
            LEFT JOIN empresas e ON r.empresa_id = e.id
            LEFT JOIN rutas rt ON r.ruta_id = rt.id
            LEFT JOIN conductores c ON r.conductor_id = c.id
            LEFT JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id
            WHERE 1=1`;
        let countQuery = 'SELECT COUNT(*) FROM registros WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (fechaInicio) {
            query += ` AND r.fecha >= $${paramIndex}`;
            countQuery += ` AND fecha >= $${paramIndex}`;
            params.push(fechaInicio);
            paramIndex++;
        }
        if (fechaFin) {
            query += ` AND r.fecha <= $${paramIndex}`;
            countQuery += ` AND fecha <= $${paramIndex}`;
            params.push(fechaFin);
            paramIndex++;
        }
        if (empresa) {
            query += ` AND r.empresa_id = $${paramIndex}`;
            countQuery += ` AND empresa_id = $${paramIndex}`;
            params.push(parseInt(empresa));
            paramIndex++;
        }
        if (vehiculo) {
            query += ` AND r.vehiculo ILIKE $${paramIndex}`;
            countQuery += ` AND vehiculo ILIKE $${paramIndex}`;
            params.push(`%${vehiculo}%`);
            paramIndex++;
        }
        if (tabla) {
            query += ` AND r.tabla ILIKE $${paramIndex}`;
            countQuery += ` AND tabla ILIKE $${paramIndex}`;
            params.push(`%${tabla}%`);
            paramIndex++;
        }
        if (horaInicio) {
            query += ` AND r.hora_inicio >= $${paramIndex}`;
            countQuery += ` AND hora_inicio >= $${paramIndex}`;
            params.push(horaInicio);
            paramIndex++;
        }
        if (horaFin) {
            query += ` AND r.hora_fin <= $${paramIndex}`;
            countQuery += ` AND hora_fin <= $${paramIndex}`;
            params.push(horaFin);
            paramIndex++;
        }
        
        query += ` ORDER BY r.fecha DESC LIMIT $${paramIndex} OFFSET $${paramIndex+1}`;
        params.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery)
        ]);
        
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: { page, limit, total, totalPages }
        });
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

// =====================================================
// STATS DASHBOARD ENDPOINT
// =====================================================
app.get('/api/stats/dashboard', authenticateToken, async (req, res) => {
    try {
        const [registrosCount, conductoresCount, empresasCount, novedadesCount, registrosPorEmpresa, registrosPorNovedad] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM registros'),
            pool.query('SELECT COUNT(*) as total FROM conductores'),
            pool.query('SELECT COUNT(*) as total FROM empresas'),
            pool.query('SELECT COUNT(*) as total FROM tipo_novedades'),
            pool.query(`
                SELECT e.nombre, COUNT(r.id) as cantidad 
                FROM registros r 
                JOIN empresas e ON r.empresa_id = e.id 
                GROUP BY e.id, e.nombre 
                ORDER BY cantidad DESC 
                LIMIT 10
            `),
            pool.query(`
                SELECT tn.nombre, COUNT(r.id) as cantidad, tn.color 
                FROM registros r 
                JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id 
                GROUP BY tn.id, tn.nombre, tn.color 
                ORDER BY cantidad DESC
            `)
        ]);
        
        res.json({
            success: true,
            stats: {
                registros: parseInt(registrosCount.rows[0].total),
                conductores: parseInt(conductoresCount.rows[0].total),
                empresas: parseInt(empresasCount.rows[0].total),
                novedades: parseInt(novedadesCount.rows[0].total)
            },
            registrosPorEmpresa: registrosPorEmpresa.rows,
            registrosPorNovedad: registrosPorNovedad.rows
        });
    } catch (error) {
        console.error('Error al obtener stats:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// =====================================================
// NUEVAS RUTAS PARA DASHBOARD AVANZADO
// =====================================================

// GET estadísticas generales mejoradas
app.get('/api/stats/dashboard-advanced', authenticateToken, async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let dateFilter = '';
        const params = [];
        
        if (fechaInicio && fechaFin) {
            dateFilter = 'WHERE r.fecha BETWEEN $1 AND $2';
            params.push(fechaInicio, fechaFin);
        } else {
            // Por defecto, últimos 30 días
            dateFilter = 'WHERE r.fecha >= CURRENT_DATE - INTERVAL \'30 days\'';
        }

        const [
            registrosCount,
            conductoresCount,
            empresasCount,
            novedadesCount,
            registrosPorEmpresa,
            registrosPorNovedad,
            registrosPorDia,
            registrosPorRuta,
            conductoresActivos,
            vehiculosMasUsados,
            horasPico,
            novedadesPorSeveridad,
            ultimosRegistros
        ] = await Promise.all([
            // Total de registros
            pool.query(`SELECT COUNT(*) as total FROM registros r ${dateFilter}`, params),
            
            // Total de conductores activos
            pool.query('SELECT COUNT(*) as total FROM conductores WHERE activo = true'),
            
            // Total de empresas activas
            pool.query('SELECT COUNT(*) as total FROM empresas WHERE activo = true'),
            
            // Total de tipos de novedades
            pool.query('SELECT COUNT(*) as total FROM tipo_novedades WHERE activo = true'),
            
            // Registros por empresa
            pool.query(`
                SELECT e.nombre, e.prefijo, COUNT(r.id) as cantidad, e.id
                FROM registros r 
                JOIN empresas e ON r.empresa_id = e.id 
                ${dateFilter}
                GROUP BY e.id, e.nombre, e.prefijo
                ORDER BY cantidad DESC 
                LIMIT 10
            `, params),
            
            // Registros por tipo de novedad
            pool.query(`
                SELECT tn.nombre, COUNT(r.id) as cantidad, tn.color, tn.severidad
                FROM registros r 
                JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id 
                ${dateFilter}
                GROUP BY tn.id, tn.nombre, tn.color, tn.severidad
                ORDER BY cantidad DESC
            `, params),
            
            // Registros por día (últimos 30 días)
            pool.query(`
                SELECT 
                    DATE(r.fecha) as fecha,
                    COUNT(*) as total,
                    COUNT(CASE WHEN r.tipo_novedad_id IS NOT NULL THEN 1 END) as con_novedad,
                    COUNT(CASE WHEN r.tipo_novedad_id IS NULL THEN 1 END) as sin_novedad
                FROM registros r
                WHERE r.fecha >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(r.fecha)
                ORDER BY fecha ASC
            `),
            
            // Registros por ruta
            pool.query(`
                SELECT 
                    COALESCE(rt.nombre, 'Sin ruta') as nombre,
                    COUNT(r.id) as cantidad
                FROM registros r 
                LEFT JOIN rutas rt ON r.ruta_id = rt.id 
                ${dateFilter}
                GROUP BY rt.nombre
                ORDER BY cantidad DESC 
                LIMIT 10
            `, params),
            
            // Conductores más activos
            pool.query(`
                SELECT 
                    c.nombre,
                    c.cedula,
                    COUNT(r.id) as total_registros,
                    COUNT(CASE WHEN r.tipo_novedad_id IS NOT NULL THEN 1 END) as con_novedades
                FROM registros r 
                JOIN conductores c ON r.conductor_id = c.id 
                ${dateFilter}
                GROUP BY c.id, c.nombre, c.cedula
                ORDER BY total_registros DESC 
                LIMIT 10
            `, params),
            
            // Vehículos más usados
            pool.query(`
                SELECT 
                    r.vehiculo,
                    COUNT(*) as cantidad,
                    COUNT(CASE WHEN r.tipo_novedad_id IS NOT NULL THEN 1 END) as con_novedades
                FROM registros r 
                ${dateFilter}
                GROUP BY r.vehiculo
                ORDER BY cantidad DESC 
                LIMIT 10
            `, params),
            
            // Horas pico (distribución por hora de inicio)
            pool.query(`
                SELECT 
                    EXTRACT(HOUR FROM r.hora_inicio) as hora,
                    COUNT(*) as cantidad
                FROM registros r 
                ${dateFilter}
                GROUP BY EXTRACT(HOUR FROM r.hora_inicio)
                ORDER BY hora
            `, params),
            
            // Novedades por severidad
            pool.query(`
                SELECT 
                    tn.severidad,
                    COUNT(r.id) as cantidad
                FROM registros r 
                JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id 
                ${dateFilter}
                GROUP BY tn.severidad
                ORDER BY 
                    CASE tn.severidad
                        WHEN 'critica' THEN 1
                        WHEN 'alta' THEN 2
                        WHEN 'media' THEN 3
                        WHEN 'baja' THEN 4
                    END
            `, params),
            
            // Últimos 5 registros
            pool.query(`
                SELECT 
                    r.id,
                    r.fecha,
                    r.hora_inicio,
                    r.vehiculo,
                    e.nombre as empresa,
                    c.nombre as conductor,
                    tn.nombre as novedad,
                    tn.severidad,
                    tn.color
                FROM registros r
                JOIN empresas e ON r.empresa_id = e.id
                LEFT JOIN conductores c ON r.conductor_id = c.id
                LEFT JOIN tipo_novedades tn ON r.tipo_novedad_id = tn.id
                ORDER BY r.fecha DESC, r.hora_inicio DESC
                LIMIT 5
            `)
        ]);
        
        res.json({
            success: true,
            stats: {
                registros: parseInt(registrosCount.rows[0].total),
                conductores: parseInt(conductoresCount.rows[0].total),
                empresas: parseInt(empresasCount.rows[0].total),
                novedades: parseInt(novedadesCount.rows[0].total)
            },
            registrosPorEmpresa: registrosPorEmpresa.rows,
            registrosPorNovedad: registrosPorNovedad.rows,
            registrosPorDia: registrosPorDia.rows,
            registrosPorRuta: registrosPorRuta.rows,
            conductoresActivos: conductoresActivos.rows,
            vehiculosMasUsados: vehiculosMasUsados.rows,
            horasPico: horasPico.rows,
            novedadesPorSeveridad: novedadesPorSeveridad.rows,
            ultimosRegistros: ultimosRegistros.rows
        });
    } catch (error) {
        console.error('Error al obtener stats avanzadas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET comparativa mensual
app.get('/api/stats/monthly-comparison', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') as mes,
                COUNT(*) as total_registros,
                COUNT(CASE WHEN tipo_novedad_id IS NOT NULL THEN 1 END) as con_novedades,
                COUNT(DISTINCT conductor_id) as conductores_unicos,
                COUNT(DISTINCT vehiculo) as vehiculos_unicos
            FROM registros
            WHERE fecha >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(fecha, 'YYYY-MM')
            ORDER BY mes DESC
        `);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener comparativa mensual:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// GET rendimiento por empresa (detalles)
app.get('/api/stats/company-performance', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.id,
                e.nombre,
                e.prefijo,
                COUNT(r.id) as total_registros,
                COUNT(CASE WHEN r.tipo_novedad_id IS NOT NULL THEN 1 END) as con_novedades,
                ROUND(
                    (COUNT(CASE WHEN r.tipo_novedad_id IS NOT NULL THEN 1 END)::decimal / 
                    NULLIF(COUNT(r.id), 0) * 100), 2
                ) as porcentaje_novedades,
                COUNT(DISTINCT r.conductor_id) as conductores_unicos,
                COUNT(DISTINCT r.vehiculo) as vehiculos_unicos
            FROM empresas e
            LEFT JOIN registros r ON e.id = r.empresa_id 
                AND r.fecha >= CURRENT_DATE - INTERVAL '30 days'
            WHERE e.activo = true
            GROUP BY e.id, e.nombre, e.prefijo
            ORDER BY total_registros DESC
        `);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener rendimiento de empresas:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de TransControl escuchando en puerto ${PORT}`);
});

module.exports = app;



