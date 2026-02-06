/**
 * =====================================================
 * SERVIDOR BACKEND - Node.js + Express + PostgreSQL
 * Sistema de Registro de Conductores
 * =====================================================
 * 
 * INSTALACIÓN:
 * 1. cd backend
 * 2. npm init -y
 * 3. npm install express pg cors bcryptjs jsonwebtoken dotenv
 * 
 * EJECUCIÓN:
 * node server.js
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURACIÓN
// =====================================================

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Servir archivos estáticos

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

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

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

// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================

// Login
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
// RUTAS DE FORMULARIOS
// =====================================================

// Crear registro
app.post('/api/formularios', async (req, res) => {
    try {
        const {
            fecha, empresa, prefijo, vehiculo, tabla,
            conductor, hora_inicio, hora_fin, servicio, novedad
        } = req.body;

        // Validaciones básicas
        if (!fecha || !empresa || !vehiculo || !conductor || !hora_inicio || !hora_fin || !servicio) {
            return res.status(400).json({ error: 'Campos obligatorios faltantes' });
        }

        const result = await pool.query(
            `INSERT INTO formulario 
            (fecha, empresa, prefijo, vehiculo, tabla, conductor, hora_inicio, hora_fin, servicio, novedad)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [fecha, empresa, prefijo, vehiculo, tabla, conductor, hora_inicio, hora_fin, servicio, novedad || null]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Registro creado correctamente'
        });

    } catch (error) {
        console.error('Error creando registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener todos los registros con filtros y paginación
app.get('/api/formularios', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            fechaInicio,
            fechaFin,
            empresa,
            conductor,
            vehiculo,
            novedad
        } = req.query;

        let query = 'SELECT * FROM formulario WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Aplicar filtros
        if (fechaInicio) {
            query += ` AND fecha >= $${paramIndex}`;
            params.push(fechaInicio);
            paramIndex++;
        }

        if (fechaFin) {
            query += ` AND fecha <= $${paramIndex}`;
            params.push(fechaFin);
            paramIndex++;
        }

        if (empresa) {
            query += ` AND empresa = $${paramIndex}`;
            params.push(empresa);
            paramIndex++;
        }

        if (conductor) {
            query += ` AND conductor ILIKE $${paramIndex}`;
            params.push(`%${conductor}%`);
            paramIndex++;
        }

        if (vehiculo) {
            query += ` AND vehiculo ILIKE $${paramIndex}`;
            params.push(`%${vehiculo}%`);
            paramIndex++;
        }

        if (novedad === 'si') {
            query += ` AND novedad IS NOT NULL AND novedad != ''`;
        } else if (novedad === 'no') {
            query += ` AND (novedad IS NULL OR novedad = '')`;
        }

        // Contar total
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Ordenar y paginar
        query += ' ORDER BY fecha DESC, fecha_creacion DESC';
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error obteniendo registros:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener un registro por ID
app.get('/api/formularios/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM formulario WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error obteniendo registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar registro
app.put('/api/formularios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fecha, empresa, prefijo, vehiculo, tabla,
            conductor, hora_inicio, hora_fin, servicio, novedad
        } = req.body;

        const result = await pool.query(
            `UPDATE formulario SET
                fecha = $1, empresa = $2, prefijo = $3, vehiculo = $4, tabla = $5,
                conductor = $6, hora_inicio = $7, hora_fin = $8, servicio = $9, novedad = $10
            WHERE id = $11
            RETURNING *`,
            [fecha, empresa, prefijo, vehiculo, tabla, conductor, hora_inicio, hora_fin, servicio, novedad, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Eliminar registro
app.delete('/api/formularios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM formulario WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ success: true, message: 'Registro eliminado' });

    } catch (error) {
        console.error('Error eliminando registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener estadísticas
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT conductor) as total_conductores,
                COUNT(DISTINCT vehiculo) as total_vehiculos,
                COUNT(CASE WHEN novedad IS NOT NULL AND novedad != '' THEN 1 END) as total_novedades
            FROM formulario
        `);

        const data = stats.rows[0];

        res.json({
            success: true,
            data: {
                totalRegistros: parseInt(data.total_registros),
                totalConductores: parseInt(data.total_conductores),
                totalVehiculos: parseInt(data.total_vehiculos),
                totalNovedades: parseInt(data.total_novedades)
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =====================================================
// RUTAS DE EMPRESAS
// =====================================================

app.get('/api/empresas', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM empresas WHERE activa = true ORDER BY nombre'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error obteniendo empresas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear empresa
app.post('/api/empresas', authenticateToken, async (req, res) => {
    try {
        const { nombre, prefijo } = req.body;

        if (!nombre || !prefijo) {
            return res.status(400).json({ error: 'Nombre y prefijo requeridos' });
        }

        const result = await pool.query(
            `INSERT INTO empresas (nombre, prefijo, activa)
            VALUES ($1, $2, true)
            RETURNING *`,
            [nombre, prefijo]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Empresa creada correctamente'
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'La empresa o prefijo ya existe' });
        }
        console.error('Error creando empresa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar empresa
app.put('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { nombre, prefijo, activa } = req.body;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE empresas SET nombre = $1, prefijo = $2, activa = $3
            WHERE id = $4
            RETURNING *`,
            [nombre, prefijo, activa !== undefined ? activa : true, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando empresa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Eliminar empresa
app.delete('/api/empresas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM empresas WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json({ success: true, message: 'Empresa eliminada' });

    } catch (error) {
        console.error('Error eliminando empresa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =====================================================
// RUTAS DE CONDUCTORES
// =====================================================

// Obtener todos los conductores
app.get('/api/conductores', async (req, res) => {
    try {
        const { empresa, buscar } = req.query;

        let query = 'SELECT * FROM conductores WHERE activo = true';
        const params = [];
        let paramIndex = 1;

        if (empresa) {
            query += ` AND empresa = $${paramIndex}`;
            params.push(empresa);
            paramIndex++;
        }

        if (buscar) {
            query += ` AND (nombre ILIKE $${paramIndex} OR cedula ILIKE $${paramIndex})`;
            params.push(`%${buscar}%`);
        }

        query += ' ORDER BY nombre';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error obteniendo conductores:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear conductor
app.post('/api/conductores', authenticateToken, async (req, res) => {
    try {
        const { nombre, cedula, telefono, email, empresa } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'Nombre es requerido' });
        }

        const result = await pool.query(
            `INSERT INTO conductores (nombre, cedula, telefono, email, empresa, activo)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING *`,
            [nombre, cedula || null, telefono || null, email || null, empresa || null]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Conductor creado correctamente'
        });

    } catch (error) {
        console.error('Error creando conductor:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar conductor
app.put('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { nombre, cedula, telefono, email, empresa } = req.body;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE conductores SET nombre = $1, cedula = $2, telefono = $3, email = $4, empresa = $5, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *`,
            [nombre, cedula || null, telefono || null, email || null, empresa || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando conductor:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Eliminar conductor
app.delete('/api/conductores/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM conductores WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }

        res.json({ success: true, message: 'Conductor eliminado' });

    } catch (error) {
        console.error('Error eliminando conductor:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =====================================================
// UTILIDADES
// =====================================================

// Ruta para crear un usuario administrador (usar solo una vez)
app.post('/api/setup/admin', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO usuarios (username, password, email, rol)
            VALUES ($1, $2, $3, 'admin')
            ON CONFLICT (username) DO NOTHING
            RETURNING id, username, rol`,
            [username, hashedPassword, email || null]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }

        res.status(201).json({
            success: true,
            message: 'Usuario administrador creado',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando admin:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
        🚌 Sistema de Registro de Conductores             
        Servidor iniciado en http://localhost:${PORT}      
╠════════════════════════════════════════════════════════╣
║  Endpoints disponibles:                                ║
║  • POST   /api/auth/login     - Iniciar sesión         ║
║  • GET    /api/formularios    - Listar registros       ║
║  • POST   /api/formularios    - Crear registro         ║
║  • GET    /api/formularios/:id - Obtener registro      ║
║  • PUT    /api/formularios/:id - Actualizar registro   ║
║  • DELETE /api/formularios/:id - Eliminar registro     ║
║  • GET    /api/stats          - Estadísticas           ║
║  • GET    /api/empresas       - Listar empresas        ║
╚════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
