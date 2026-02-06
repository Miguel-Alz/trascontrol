/**
 * Script para resetear el usuario administrador
 * Ejecutar: node reset-admin.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'conductores_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
});

async function resetAdmin() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        
        // Eliminar usuario admin existente
        await pool.query("DELETE FROM usuarios WHERE username = 'admin'");
        console.log('🗑️  Usuario admin anterior eliminado (si existía)');

        // Crear hash de la contraseña
        const hashedPassword = await bcrypt.hash('admin123', 10);
        console.log('🔐 Hash generado para password: admin123');

        // Insertar nuevo usuario admin
        const result = await pool.query(
            `INSERT INTO usuarios (username, password, email, rol, activo) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, username, rol`,
            ['admin', hashedPassword, 'admin@example.com', 'admin', true]
        );

        console.log('✅ Usuario administrador creado exitosamente!');
        console.log('');
        console.log('📋 Credenciales:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: admin123');
        console.log('');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

resetAdmin();
